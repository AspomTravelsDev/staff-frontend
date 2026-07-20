export type DocumentCategory =
    | 'handbook'
    | 'policies'
    | 'contracts'
    | 'checklist'
    | 'sop'
    | 'job_description'
    | 'guide'
    | 'visa'
    | 'general'
    | 'nysc'
    | 'other';
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
    file_path?: string;
    file_size: number;
    mime_type?: string;
    original_name?: string;
    created_at: string;
    updated_at: string;
    uploaded_by: {
        id: string;
        name: string;
    };
    download_url?: string;
    folder_id?: string | null;
}

export interface CreateDocumentRequest {
    title: string;
    type: string;
    category: string;
    department: string;
    tags?: string;
    description?: string;
    folder_id?: string | null;
}

export interface UploadDocumentResponse {
    message: string;
    data: DocumentFile;
}

export interface DocumentCategoriesResponse {
    categories: Array<{ value: DocumentCategory; label: string }>;
    types: Array<{ value: DocumentType; label: string }>;
}

export interface DocumentFilters {
    type?: string;
    category?: string;
    department?: string;
    tags?: string;
    search?: string;
    visibility_scope?: 'my';
    folder_id?: string;
}

export interface DocumentFolder {
    id: string;
    name: string;
    parent_id: string | null;
    type: string;
    department: string;
    created_by: {
        id: string;
        name: string;
    };
    created_at: string;
}

export interface BreadcrumbItem {
    id: string;
    name: string;
}

export interface NestedDocumentsResponse {
    folders: DocumentFolder[];
    documents: DocumentFile[];
    breadcrumbs: BreadcrumbItem[];
}
