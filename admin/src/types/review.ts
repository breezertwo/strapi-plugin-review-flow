export interface Comment {
  id: number;
  documentId: string;
  content: string;
  commentType: 'assignment' | 'rejection' | 're-request' | 'approval' | 'general';
  createdAt: string;
  author?: {
    id: number;
    firstname?: string;
    lastname?: string;
  };
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
