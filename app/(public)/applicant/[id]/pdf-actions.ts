'use server'

import { renderToBuffer } from '@react-pdf/renderer'
import { GuarantorFormPdf } from './pdf-templates/guarantor-form'
import { RefereeFormPdf } from './pdf-templates/referee-form'
import { COMPANY_LOGO_URL } from './pdf-templates/styles'
import { ApplicationFormData } from '@/lib/types/form-data'
import { getPublicApplication, uploadPublicFile, savePublicFormStep } from '@/lib/api/hr'
import React from 'react'
import fs from 'fs'
import path from 'path'

/** Helper to fetch an image securely (via proxy if needed) and convert to base64 string for React-PDF */
async function fetchImageAsBase64(imageUrl: string | undefined): Promise<string | undefined> {
    if (!imageUrl) return undefined;

    try {
        // Run through our proxy to normalize URLs and avoid strict CORS
        const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy-file?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            console.error(`Failed to fetch image for PDF: ${response.statusText}`);
            return undefined;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error('Error converting image to base64:', error);
        return undefined;
    }
}

/** Helper to read the company logo from the public directory and convert to base64 */
async function fetchLogoAsBase64(): Promise<string | undefined> {
    try {
        const logoPath = path.join(process.cwd(), 'public', 'aspom-logo.webp');
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            return `data:image/webp;base64,${logoBuffer.toString('base64')}`;
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
}

type PdfMetadata = {
    storagePath: string
    generatedAt: string
    fileSize: number
}

type GeneratedPdfs = {
    guarantor1?: PdfMetadata
    guarantor2?: PdfMetadata
    referee?: PdfMetadata
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
        const file = new File([fileBytes as any], fileName, { type: 'application/pdf' })

        // Upload to Laravel
        const uploadResult = await uploadPublicFile(uuid, file, fieldName)

        return {
            url: uploadResult.storagePath,
            metadata: {
                storagePath: uploadResult.storagePath,
                generatedAt: uploadResult.uploadedAt,
                fileSize: pdfBuffer.length,
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
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })

        // Check if PDFs already exist in metadata
        const existingPdfs = (formData as any).generatedPdfs as GeneratedPdfs | undefined
        const results: PdfDownloadResult = {}

        let newPdfsGenerated = false
        const updatedGeneratedPdfs: GeneratedPdfs = { ...existingPdfs }

        const positionTitle = application.position_title
        const applicationId = application.application_id
        const personal = formData.personal || {}

        // Fetch applicant signature
        const applicantSignatureUrl = await fetchImageAsBase64(formData.media?.signature?.storagePath);

        // Fetch company logo as base64
        const companyLogoBase64 = await fetchLogoAsBase64();
        const logoUrl = companyLogoBase64 || COMPANY_LOGO_URL;

        // Generate Guarantor 1 PDF
        const guarantor1 = formData.guarantorReferee?.guarantors?.[0]
        if (guarantor1) {
            if (existingPdfs?.guarantor1?.storagePath) {
                results.guarantor1Url = existingPdfs.guarantor1.storagePath
            } else {
                const base64Photo = await fetchImageAsBase64(guarantor1.passportPhoto?.storagePath);

                const result = await generateAndUploadPdf(
                    uuid,
                    'guarantor_1_form.pdf',
                    'guarantor_1_form',
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
        }

        // Generate Guarantor 2 PDF
        const guarantor2 = formData.guarantorReferee?.guarantors?.[1]
        if (guarantor2) {
            if (existingPdfs?.guarantor2?.storagePath) {
                results.guarantor2Url = existingPdfs.guarantor2.storagePath
            } else {
                const base64Photo = await fetchImageAsBase64(guarantor2.passportPhoto?.storagePath);

                const result = await generateAndUploadPdf(
                    uuid,
                    'guarantor_2_form.pdf',
                    'guarantor_2_form',
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
        }

        // Generate Referee PDF
        const referee = formData.guarantorReferee?.referee
        if (referee) {
            if (existingPdfs?.referee?.storagePath) {
                results.refereeUrl = existingPdfs.referee.storagePath
            } else {
                const base64Photo = await fetchImageAsBase64(referee.passportPhoto?.storagePath);

                const result = await generateAndUploadPdf(
                    uuid,
                    'referee_form.pdf',
                    'referee_form',
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
        }

        // Output to Laravel (save PDF metadata)
        if (newPdfsGenerated) {
            // Update the form_data via saveFormStep API without altering current step logic
            // We use standard step 7 as the current step to hold this update
            await savePublicFormStep(uuid, formData.currentStep, { generatedPdfs: updatedGeneratedPdfs })
        }

        return results
    } catch (error) {
        console.error('Download PDF forms error:', error)
        return { error: 'Failed to generate PDF forms' }
    }
}
