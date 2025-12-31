import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, Button, CircularProgress } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { documentService } from '../../services/documentService';
import { formatFileSize } from '../../utils';

interface DocumentViewerProps {
    trialId: string;
    category?: string;
    label?: string;
}

interface Document {
    document_id: number;
    file_name: string;
    document_type: string;
    file_base64: string;
    uploaded_by: string;
    uploaded_at: string;
    remarks: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ trialId, category, label = "Previously Attached Files" }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!trialId) return;

            setLoading(true);
            try {
                const response = await documentService.getDocument(trialId);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && Array.isArray(data.data)) {
                        let docs = data.data;
                        if (category) {
                            docs = docs.filter((d: Document) => d.document_type === category);
                        }
                        setDocuments(docs);
                    }
                } else {
                    console.error("Failed to fetch documents");
                }
            } catch (err) {
                console.error("Error fetching documents:", err);
                setError("Failed to load documents");
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [trialId, category]);

    const handleViewFile = (file: Document) => {
        const win = window.open();
        if (win) {
            win.document.write(
                `<html><head><title>${file.file_name}</title></head><body style="margin:0"><iframe src="${file.file_base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe></body></html>`
            );
        }
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <PictureAsPdfIcon color="error" />;
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <ImageIcon color="primary" />;
        return <DescriptionIcon />;
    };

    if (loading) return <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}><CircularProgress size={20} /><Typography variant="body2">Loading documents...</Typography></Box>;

    if (documents.length === 0) return null;

    return (
        <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary', textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                {documents.map((doc) => (
                    <ListItem
                        key={doc.document_id}
                        secondaryAction={
                            <Button
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleViewFile(doc)}
                                sx={{ textTransform: 'none' }}
                            >
                                View
                            </Button>
                        }
                        sx={{ borderBottom: '1px solid #f0f0f0', '&:last-child': { borderBottom: 'none' } }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            {getFileIcon(doc.file_name)}
                        </ListItemIcon>
                        <ListItemText
                            primary={doc.file_name}
                            secondary={`Uploaded by ${doc.uploaded_by} on ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default DocumentViewer;
