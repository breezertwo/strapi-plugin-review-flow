export interface Comment {
  id: number;
  documentId: string;
  content: string;
  commentType: 'assignment' | 'rejection' | 're-request' | 'approval' | 'general' | 'field-comment';
  createdAt: string;
  fieldName?: string | null;
  resolved?: boolean;
  author?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
}

export interface LocaleReview {
  locale: string;
  reviewDocumentId: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: Comment[];
  reviewedAt?: string;
}

export interface ReviewGroup {
  key: string;
  assignedDocumentId: string;
  assignedContentType: string;
  documentTitle: string | null;
  assignedBy?: Review['assignedBy'];
  assignedTo?: Review['assignedTo'];
  locales: LocaleReview[];
}

export interface Review {
  documentId: string;
  assignedContentType: string;
  assignedDocumentId: string;
  locale: string;
  status: string;
  documentTitle?: string | null;
  reviewedAt?: string;
  assignedBy?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
  assignedTo?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
  createdAt?: string;
  comments?: Comment[];
}
