'use server'

import { renderToBuffer } from '@react-pdf/renderer'
import { GuarantorFormPdf } from './pdf-templates/guarantor-form'
import { RefereeFormPdf } from './pdf-templates/referee-form'
import { OfferLetterPdf } from './pdf-templates/offer-letter'
import { NdaLetterPdf } from './pdf-templates/nda'
import { COMPANY_LOGO_URL } from './pdf-templates/styles'
import { ApplicationFormData } from '@/lib/types/form-data'
import { getPublicApplication, uploadPublicFile, savePublicFormStep } from '@/lib/api/hr'
import React from 'react'
import fs from 'fs'
import path from 'path'

/** Helper to fetch an image securely (via proxy if needed) and convert to base64 string for React-PDF */
async function fetchImageAsBase64(imageUrl: string | undefined): Promise<string | undefined> {
    if (!imageUrl) {
        console.log("fetchImageAsBase64: No URL provided");
        return undefined;
    }

    try {
        let targetUrl = imageUrl;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // If it's a URL to our backend, ensure it uses the correct internal API URL
        if (targetUrl.startsWith('/api/') || targetUrl.includes('localhost:8000') || targetUrl.includes('127.0.0.1:8000')) {
            if (targetUrl.startsWith('/')) {
                targetUrl = `${apiUrl}${targetUrl}`;
            } else {
                // If it's an absolute URL pointing to localhost/127.0.0.1, replace the origin with apiUrl
                try {
                    const parsedUrl = new URL(targetUrl);
                    targetUrl = `${apiUrl}${parsedUrl.pathname}${parsedUrl.search}`;
                } catch (e) {
                    // Fallback
                    targetUrl = targetUrl.replace('http://localhost:8000', apiUrl).replace('http://127.0.0.1:8000', apiUrl);
                }
            }
        } else if (!targetUrl.startsWith('data:')) {
            // External URL? Use our proxy to avoid CORS/Fetch issues within react-pdf rendering
            targetUrl = `${appUrl}/api/proxy-file?url=${encodeURIComponent(imageUrl)}`;
        }

        console.log(`fetchImageAsBase64: Fetching image from ${targetUrl}`);

        const response = await fetch(targetUrl);
        if (!response.ok) {
            console.error(`fetchImageAsBase64: Failed to fetch image. Status: ${response.status} ${response.statusText} from ${targetUrl}`);
            return undefined;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        console.log(`fetchImageAsBase64: Successfully fetched image (${base64.length} chars, ${contentType})`);
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error(`fetchImageAsBase64: Error converting image to base64 from ${imageUrl}:`, error);
        return undefined;
    }
}

/** Helper to read the company logo from the public directory and convert to base64 */
async function fetchLogoAsBase64(): Promise<string | undefined> {
    try {
        const logoPath = path.join(process.cwd(), 'public', 'aspom-logo.png');
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            return `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
        return undefined;
    } catch (error) {
        console.error('Error reading company logo:', error);
        return undefined;
    }
}

type PdfDownloadResult = {
    error?: string
    guarantor1Url?: string
    guarantor2Url?: string
    refereeUrl?: string
    offerLetterUrl?: string
    ndaUrl?: string
    indemnityUrl?: string
}

type PdfMetadata = {
    storagePath: string
    generatedAt: string
    fileSize: number
    fileId?: string
}

type GeneratedPdfs = {
    guarantor1?: PdfMetadata
    guarantor2?: PdfMetadata
    referee?: PdfMetadata
    offerLetter?: PdfMetadata
    nda?: PdfMetadata
    indemnity?: PdfMetadata
}

async function generateAndUploadPdf(
    uuid: string,
    fileName: string,
    fieldName: string,
    pdfElement: any
): Promise<{ url: string; metadata: PdfMetadata } | { error: string }> {
    try {
        // Render PDF to buffer
        const pdfBuffer = await renderToBuffer(pdfElement)

        // Convert the Node Buffer to a Uint8Array which is a valid BlobPart
        const fileBytes = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.length)

        // Create File object for upload
        // In Node environments where File might not be global, we use Blob
        const fileContent = [fileBytes as any]
        const fileOptions = { type: 'application/pdf' }
        const file = typeof File !== 'undefined'
            ? new File(fileContent, fileName, fileOptions)
            : new Blob(fileContent, fileOptions) as any

        // Add name if it's a blob so FormData treats it as a file
        const isFile = typeof File !== 'undefined' && file instanceof File;
        if (!isFile && (file as any).name === undefined) {
            (file as any).name = fileName;
        }

        // Upload to Laravel
        const uploadResult = await uploadPublicFile(uuid, file, fieldName)

        return {
            url: uploadResult.storagePath,
            metadata: {
                storagePath: uploadResult.storagePath,
                generatedAt: uploadResult.uploadedAt,
                fileSize: pdfBuffer.length,
                fileId: uploadResult.fileId,
            },
        }
    } catch (error) {
        console.error(`PDF generation error for ${fileName}:`, error)
        return { error: `Failed to generate ${fileName}` }
    }
}

export async function downloadPdfFormsAction(uuid: string): Promise<PdfDownloadResult> {
    try {
        // Fetch application data
        const application = await getPublicApplication(uuid)
        const formData = (application.form_data || {}) as unknown as ApplicationFormData
        const generatedAt = new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })

        const signatureDate = application.completed_at
            ? new Date(application.completed_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            })
            : generatedAt;

        // Check if PDFs already exist in metadata
        const existingPdfs = (formData as any).generatedPdfs as GeneratedPdfs | undefined
        const results: PdfDownloadResult = {}

        let newPdfsGenerated = false
        const updatedGeneratedPdfs: GeneratedPdfs = { ...existingPdfs }

        const positionTitle = application.position_title
        const applicationId = application.application_id
        const indemnityFileName = 'ASPOM_INDEMNITY_-_DUBAI.pdf'
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const personal = formData.personal || {
            firstName: application.applicant_name?.split(' ')[0] || '',
            lastName: application.applicant_name?.split(' ').slice(1).join(' ') || ''
        }

        // Fetch applicant signature
        const applicantSignatureUrl = await fetchImageAsBase64(formData.media?.signature?.storagePath);

        // Fetch company logo as base64
        const companyLogoBase64 = await fetchLogoAsBase64();
        const logoUrl = companyLogoBase64 || COMPANY_LOGO_URL;

        // Generate Guarantor 1 PDF
        const guarantor1 = formData.guarantorReferee?.guarantors?.[0]
        if (guarantor1) {
            const base64Photo = await fetchImageAsBase64(guarantor1.passportPhoto?.storagePath);

            const result = await generateAndUploadPdf(
                uuid,
                'guarantor_1_form.pdf',
                `guarantor_1_form_${uuid}`,
                React.createElement(GuarantorFormPdf, {
                    guarantor: guarantor1,
                    applicant: personal,
                    guarantorIndex: 1,
                    applicationId,
                    positionTitle,
                    generatedAt,
                    companyLogoUrl: logoUrl,
                    passportPhotoUrl: base64Photo,
                    applicantSignatureUrl,
                })
            )

            if ('error' in result) return { error: result.error }

            results.guarantor1Url = result.url
            updatedGeneratedPdfs.guarantor1 = result.metadata
            newPdfsGenerated = true
        }

        // Generate Guarantor 2 PDF
        const guarantor2 = formData.guarantorReferee?.guarantors?.[1]
        if (guarantor2) {
            const base64Photo = await fetchImageAsBase64(guarantor2.passportPhoto?.storagePath);

            const result = await generateAndUploadPdf(
                uuid,
                'guarantor_2_form.pdf',
                `guarantor_2_form_${uuid}`,
                React.createElement(GuarantorFormPdf, {
                    guarantor: guarantor2,
                    applicant: personal,
                    guarantorIndex: 2,
                    applicationId,
                    positionTitle,
                    generatedAt,
                    companyLogoUrl: logoUrl,
                    passportPhotoUrl: base64Photo,
                    applicantSignatureUrl,
                })
            )

            if ('error' in result) return { error: result.error }

            results.guarantor2Url = result.url
            updatedGeneratedPdfs.guarantor2 = result.metadata
            newPdfsGenerated = true
        }

        // Generate Referee PDF
        const referee = formData.guarantorReferee?.referee
        if (referee) {
            const base64Photo = await fetchImageAsBase64(referee.passportPhoto?.storagePath);

            const result = await generateAndUploadPdf(
                uuid,
                'referee_form.pdf',
                `referee_form_${uuid}`,
                React.createElement(RefereeFormPdf, {
                    referee,
                    applicant: personal,
                    applicationId,
                    positionTitle,
                    generatedAt,
                    companyLogoUrl: logoUrl,
                    passportPhotoUrl: base64Photo,
                    applicantSignatureUrl,
                })
            )

            if ('error' in result) return { error: result.error }

            results.refereeUrl = result.url
            updatedGeneratedPdfs.referee = result.metadata
            newPdfsGenerated = true
        }

        // Generate Offer Letter PDF
        const employmentTerms = (formData as any).employment_terms
        if (employmentTerms) {
            const result = await generateAndUploadPdf(
                uuid,
                'offer_letter.pdf',
                `offer_letter_${uuid}`,
                React.createElement(OfferLetterPdf, {
                    applicant: personal,
                    employmentTerms,
                    applicationId: applicationId || '',
                    generatedAt,
                    companyLogoUrl: logoUrl,
                    signatureUrl: applicantSignatureUrl,
                    signatureDate: signatureDate,
                })
            )

            if ('error' in result) return { error: result.error }

            results.offerLetterUrl = result.url
            updatedGeneratedPdfs.offerLetter = result.metadata
            newPdfsGenerated = true
        }

        // Generate NDA PDF
        const personalAddress = personal?.residentialAddress
            ? `${personal.residentialAddress.street || ''}, ${personal.residentialAddress.city || ''}, ${personal.residentialAddress.state || ''}, ${personal.residentialAddress.country || ''}`
                .replace(/\s+,/g, ',')
                .replace(/^,\s*/, '')
                .replace(/,\s*,/g, ', ')
            : ''

        const ndaResult = await generateAndUploadPdf(
            uuid,
            'nda_agreement.pdf',
            `nda_agreement_${uuid}`,
            React.createElement(NdaLetterPdf, {
                employeeName: `${personal.firstName || ''} ${personal.middleName || ''} ${personal.lastName || ''}`.trim() || application.applicant_name || 'Applicant',
                employeeAddress: personalAddress,
                jobTitle: positionTitle,
                executionDate: generatedAt,
                applicationId: applicationId || '',
                generatedAt,
                companyLogoUrl: logoUrl,
                signatureUrl: applicantSignatureUrl,
                signatureDate,
            })
        )

        if ('error' in ndaResult) {
            return { error: ndaResult.error }
        }

        results.ndaUrl = ndaResult.url
        updatedGeneratedPdfs.nda = ndaResult.metadata
        newPdfsGenerated = true

        const indemnityPublicUrl = `${apiUrl}/api/public/onboarding-applications/${uuid}/assets/${encodeURIComponent(indemnityFileName)}`
        results.indemnityUrl = indemnityPublicUrl
        updatedGeneratedPdfs.indemnity = {
            storagePath: indemnityPublicUrl,
            generatedAt: new Date().toISOString(),
            fileSize: 0,
        }
        newPdfsGenerated = true

        // Output to Laravel (save PDF metadata)
        if (newPdfsGenerated) {
            // Update the form_data via saveFormStep API without altering current step logic
            // We use standard step 1 or current step to hold this update
            await savePublicFormStep(uuid, formData.currentStep || 1, { generatedPdfs: updatedGeneratedPdfs })
        }

        return results
    } catch (error) {
        console.error('Download PDF forms error:', error)
        return { error: 'Failed to generate PDF forms' }
    }
}
