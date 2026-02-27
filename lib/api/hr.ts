import { CreateApplicationRequest, OnboardingApplication } from "@/lib/types/hr";

// Mock data store
let MOCK_APPLICATIONS: OnboardingApplication[] = [
    // {
    //     id: "48d3013a-79c8-4957-a12d-e594225e8b17",
    //     application_id: "APP-001",
    //     applicant_email: "gabbydamian92@gmail.com",
    //     position_title: "IT Officer",
    //     reporting_to: "Manuels Effe",
    //     effective_date: "2026-01-19",
    //     salary_gross: 100000,
    //     salary_net: 85030,
    //     status: "in_progress",
    //     invited_at: "2026-01-22T10:00:00Z",
    //     salary_breakdown: {
    //         basic: 18350,
    //         rent_housing: 5520,
    //         transport: 5520,
    //         medical: 18260,
    //         furniture: 6340,
    //         utility: 3450,
    //         entertainment: 4460,
    //         meal_subsidy: 13360,
    //         clothing: 13280,
    //         passages: 11460,
    //         statutory_tax_deduction: 14970,
    //         net_salary: 85030
    //     },
    //     form_data: {
    //         legal: {
    //             ndaAccepted: true,
    //             ndaAcceptedAt: "2026-01-22T11:25:41.963Z",
    //             termsAccepted: true,
    //             termsAcceptedAt: "2026-01-22T11:25:41.965Z",
    //             nonCompeteAccepted: true,
    //             nonCompeteAcceptedAt: "2026-01-22T11:25:41.964Z",
    //             confidentialityAccepted: true,
    //             confidentialityAcceptedAt: "2026-01-22T11:25:41.965Z"
    //         },
    //         media: {
    //             signature: {
    //                 fileName: "signature.png",
    //                 uploadedAt: "2026-01-22T11:26:52.975Z",
    //                 storagePath: "https://example.com/signature.png"
    //             },
    //             passportPhoto: {
    //                 fileName: "pass.jpeg",
    //                 uploadedAt: "2026-01-22T11:26:52.975Z",
    //                 storagePath: "https://example.com/pass.jpeg"
    //             }
    //         },
    //         personal: {
    //             email: "gabbydamian92@gmail.com",
    //             title: "Mr",
    //             gender: "male",
    //             lastName: "Damian",
    //             religion: "",
    //             firstName: "Gabriel",
    //             gateColor: "",
    //             birthplace: "",
    //             houseColor: "",
    //             middleName: "Olumide",
    //             dateOfBirth: "2026-01-09",
    //             nationality: "Nigerian",
    //             phoneNumber: "09072541962",
    //             maritalStatus: "single",
    //             identification: {
    //                 passportNo: "",
    //                 passportExpiryDate: "",
    //                 nationalIdOrVotersCardNo: ""
    //             },
    //             languagesSpoken: [],
    //             nearestLandmark: "Burger King",
    //             emergencyContact: {
    //                 name: "Gabriel Olumide Damian",
    //                 address: "No 13 Biala Estate",
    //                 phoneNumber: "09072541962",
    //                 relationship: "Mother"
    //             },
    //             residentialAddress: {
    //                 city: "Ibadan",
    //                 state: "Oyo",
    //                 street: "No 13 Biala Estate",
    //                 busStop: "",
    //                 country: "Nigeria"
    //             },
    //             buildingDescription: "",
    //             alternatePhoneNumber: ""
    //         },
    //         documents: {
    //             downloadedAt: "2026-01-22T11:28:24.641Z",
    //             formsDownloaded: true
    //         },
    //         currentStep: 7,
    //         lastUpdated: "2026-01-22T11:28:25.910Z",
    //         submittedAt: "2026-01-22T11:28:54.248Z",
    //         completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
    //         signedDocuments: {
    //             refereeSigned: {
    //                 fileName: "referee_form_2.pdf",
    //                 uploadedAt: "2026-01-22T11:28:53.062Z",
    //                 storagePath: "https://example.com/referee_signed.pdf"
    //             },
    //             guarantor1Signed: {
    //                 fileName: "guarantor_2_form.pdf",
    //                 uploadedAt: "2026-01-22T11:28:51.568Z",
    //                 storagePath: "https://example.com/guarantor_1_signed.pdf"
    //             },
    //             guarantor2Signed: {
    //                 fileName: "guarantor_1_form.pdf",
    //                 uploadedAt: "2026-01-22T11:28:52.497Z",
    //                 storagePath: "https://example.com/guarantor_2_signed.pdf"
    //             }
    //         },
    //         employment_terms: {
    //             net_salary: 85030,
    //             gross_salary: 100000,
    //             reporting_to: "Manuels Effe",
    //             effective_date: "2026-01-19",
    //             salary_breakdown: {
    //                 basic: 18350,
    //                 medical: 18260,
    //                 utility: 3450,
    //                 clothing: 13280,
    //                 passages: 11460,
    //                 furniture: 6340,
    //                 transport: 5520,
    //                 meal_subsidy: 13360,
    //                 rent_housing: 5520,
    //                 entertainment: 4460,
    //                 statutory_tax_deduction: 14970,
    //                 net_salary: 85030
    //             },
    //             staff_designation: "IT Officer",
    //             statutory_tax_deduction: 14970
    //         },
    //         guarantorReferee: {
    //             referee: {
    //                 address: "No 13 Biala Estate",
    //                 fullName: "Gabriel Olumide Damian",
    //                 position: "",
    //                 assessment: {
    //                     capacity: null,
    //                     lastContact: null,
    //                     howLongKnown: "",
    //                     primarySkills: null,
    //                     areasToImprove: null,
    //                     characterOpinion: null,
    //                     abilityToGetAlong: null,
    //                     collaborationComfort: null,
    //                     recommendForPosition: null,
    //                     observedIllegalActivity: null
    //                 },
    //                 occupation: "",
    //                 yearsKnown: null,
    //                 phoneNumber: "09072541962",
    //                 emailAddress: "gabbydamian92@gmail.com",
    //                 howLongKnown: "",
    //                 organization: "IINVIO",
    //                 nameOfReferee: null,
    //                 passportPhoto: {
    //                     fileName: "third.jpg",
    //                     uploadedAt: "2026-01-22T11:26:34.755Z",
    //                     storagePath: "https://example.com/referee_pass"
    //                 },
    //                 relationshipType: "",
    //                 phoneNumberAlternate: "",
    //                 professionalAssessment: null
    //             },
    //             guarantors: [
    //                 {
    //                     email: "gabbydamian92@gmail.com",
    //                     ageDob: "",
    //                     address: {
    //                         city: "Ibadan",
    //                         state: "Oyo",
    //                         street: "No 13 Biala Estate",
    //                         country: "Nigeria",
    //                         homeAddress: null
    //                     },
    //                     lastName: "Damian",
    //                     position: "",
    //                     firstName: "Gabriel",
    //                     middleName: "Olumide",
    //                     occupation: "",
    //                     yearsKnown: null,
    //                     phoneNumber: "09072541962",
    //                     employerName: "",
    //                     relationship: "",
    //                     passportPhoto: {
    //                         fileName: "man.jpg",
    //                         uploadedAt: "2026-01-22T11:26:19.658Z",
    //                         storagePath: "https://example.com/guarantor1_pass"
    //                     },
    //                     employerAddress: "No 13 Biala Estate",
    //                     liabilityAccepted: true,
    //                     characterAssessment: "",
    //                     liabilityAcceptedAt: "2026-01-22T11:26:19.658Z",
    //                     alternatePhoneNumber: ""
    //                 },
    //                 {
    //                     email: "gabbydamian92@gmail.com",
    //                     ageDob: "",
    //                     address: {
    //                         city: "",
    //                         state: "",
    //                         street: "",
    //                         country: "",
    //                         homeAddress: null
    //                     },
    //                     lastName: "Damian",
    //                     position: "",
    //                     firstName: "Gabriel",
    //                     middleName: "Olumide",
    //                     occupation: "",
    //                     yearsKnown: null,
    //                     phoneNumber: "09072541962",
    //                     employerName: "",
    //                     relationship: "",
    //                     passportPhoto: {
    //                         fileName: "woman.jpg",
    //                         uploadedAt: "2026-01-22T11:26:19.658Z",
    //                         storagePath: "https://example.com/guarantor2_pass"
    //                     },
    //                     employerAddress: "",
    //                     liabilityAccepted: true,
    //                     characterAssessment: "",
    //                     liabilityAcceptedAt: "2026-01-22T11:26:19.658Z",
    //                     alternatePhoneNumber: ""
    //                 }
    //             ]
    //         },
    //         employmentFinance: {
    //             education: [
    //                 {
    //                     grade: "",
    //                     degree: "",
    //                     endYear: "3222",
    //                     startYear: "3211",
    //                     institution: "hyhyhyyh",
    //                     fieldOfStudy: "",
    //                     qualification: ""
    //                 }
    //             ],
    //             bankDetails: {
    //                 bankName: "opay",
    //                 accountName: "",
    //                 accountNumber: "7010243237"
    //             }
    //         }
    //     }
    // },
    // {
    //     id: "uuid-2",
    //     application_id: "APP-002",
    //     applicant_email: "sarah.smith@example.com",
    //     position_title: "Product Designer",
    //     reporting_to: "Mike Lead",
    //     effective_date: "2026-02-01",
    //     salary_gross: 180000,
    //     salary_net: 153054,
    //     status: "pending",
    //     invited_at: "2026-01-26T09:00:00Z",
    //     salary_breakdown: {
    //         basic: 33030,
    //         rent_housing: 9936,
    //         transport: 9936,
    //         medical: 32868,
    //         furniture: 11412,
    //         utility: 6210,
    //         entertainment: 8028,
    //         meal_subsidy: 24048,
    //         clothing: 23904,
    //         passages: 20628,
    //         statutory_tax_deduction: 26946,
    //         net_salary: 153054
    //     },
    //     form_data: {} // Empty for pending application
    // }
];

export async function getApplications(): Promise<OnboardingApplication[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_APPLICATIONS;
}

export async function createApplication(data: CreateApplicationRequest): Promise<OnboardingApplication> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newApp: OnboardingApplication = {
        id: `uuid-${Date.now()}`,
        application_id: `APP-${Date.now().toString().slice(-3)}`,
        applicant_email: data.applicant_email,
        position_title: data.position_title,
        reporting_to: data.reporting_to,
        effective_date: data.effective_date,
        salary_gross: data.salary_gross,
        salary_net: data.salary_breakdown.net_salary,
        status: 'pending',
        invited_at: new Date().toISOString(),
        salary_breakdown: data.salary_breakdown,
        form_data: {}
    };

    MOCK_APPLICATIONS = [newApp, ...MOCK_APPLICATIONS];
    return newApp;
}

export async function deleteApplication(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    MOCK_APPLICATIONS = MOCK_APPLICATIONS.filter(app => app.id !== id);
}
