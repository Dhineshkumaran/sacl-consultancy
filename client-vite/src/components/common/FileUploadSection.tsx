import React from 'react';
import { Box, Button, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { validateFileSizes, formatFileSize } from '../../utils';

interface FileUploadSectionProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    onFileRemove: (index: number) => void;
    maxSize?: number;
    accept?: string;
    multiple?: boolean;
    label?: string;
    showAlert?: (severity: 'success' | 'error', message: string) => void;
    disabled?: boolean;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
    files,
    onFilesChange,
    onFileRemove,
    accept = "image/*,application/pdf",
    multiple = true,
    label = "Attach Files",
    showAlert,
    disabled = false
}) => {
    const [fileError, setFileError] = React.useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError(null);
        const selectedFiles = Array.from(e.target.files ?? []);

        if (selectedFiles.length === 0) return;

        const validation = validateFileSizes(selectedFiles);

        if (!validation.isValid) {
            const errorMessage = validation.errors[0];
            setFileError(errorMessage);

            if (showAlert) {
                showAlert('error', errorMessage);
            } else {
                alert(errorMessage);
            }

            e.target.value = '';
            return;
        }

        onFilesChange(selectedFiles);
        e.target.value = '';
    };

    return (
        <Box>
            <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                sx={{ mb: files.length > 0 ? 2 : 0 }}
                disabled={disabled}
            >
                {label}
                <input
                    hidden
                    type="file"
                    multiple={multiple}
                    accept={accept}
                    onChange={handleFileChange}
                    disabled={disabled}
                />
            </Button>

            {fileError && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, mb: 1 }}>
                    {fileError}
                </Typography>
            )}

            {files.length > 0 && (
                <List dense>
                    {files.map((file, index) => (
                        <ListItem
                            key={`${file.name}-${index}`}
                            secondaryAction={
                                <Box>
                                    <IconButton
                                        aria-label="view"
                                        onClick={() => window.open(URL.createObjectURL(file), '_blank')}
                                        size="small"
                                        sx={{ mr: 1, color: 'primary.main' }}
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() => onFileRemove(index)}
                                        size="small"
                                        disabled={disabled}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            }
                            sx={{
                                bgcolor: 'background.paper',
                                mb: 0.5,
                                borderRadius: 1,
                                border: '1px solid #e2e8f0'
                            }}
                        >
                            <ListItemText
                                primary={file.name}
                                secondary={formatFileSize(file.size)}
                                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
};

export default FileUploadSection;
