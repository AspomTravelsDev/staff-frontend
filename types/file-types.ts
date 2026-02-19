export type DocumentCategory = 'handbook' | 'policies' | 'contracts';

export interface DocumentFile {
    id: string;
    file_id?: string; // Some endpoints might return this separate file ID
    title: string;
    description: string | null;
    category: string;
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
    download_url?: string; // Optional helper from API
}

export interface CreateDocumentRequest {
    title: string;
    category: DocumentCategory;
    description?: string;
}

export interface UploadDocumentResponse {
    message: string;
    document: DocumentFile;
}

export interface DocumentFilters {
    category?: string;
    search?: string;
}
