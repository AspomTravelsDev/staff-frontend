export type DocumentCategory = 'handbook' | 'policies' | 'contracts' | 'visa' | 'general' | 'nysc' | 'other';
export type DocumentType = 'hr' | 'visa' | 'onboarding' | 'general';

export interface DocumentFile {
    id: string;
    file_id?: string;
    title: string;
    description: string | null;
    type: DocumentType;
    type_label?: string;
    category: string;
    category_label?: string;
    department: string;
    tags: string[] | null;
    file_path: string;
    file_size: number;
    mime_type: string;
    original_name?: string;
    created_at: string;
    updated_at: string;
    uploaded_by: {
        id: string;
        name: string;
    };
    download_url?: string;
}

export interface CreateDocumentRequest {
    title: string;
    type: string;
    category: string;
    department: string;
    tags?: string;
    description?: string;
}

export interface UploadDocumentResponse {
    message: string;
    document: DocumentFile;
}

export interface DocumentFilters {
    type?: string;
    category?: string;
    department?: string;
    tags?: string;
    search?: string;
}
