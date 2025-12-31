import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    CircularProgress,
    Alert,
    TextField,
    Box,
    Typography,
    Checkbox
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { masterListService } from '../../services/masterListService';
import DeleteMasterModal from './DeleteMasterModal';

interface MasterListTableProps {
    onEdit: (data: any) => void;
}

const MasterListTable: React.FC<MasterListTableProps> = ({ onEdit }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Selection and Delete state
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState<{ ids: number[], names: string[] } | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await masterListService.getAllMasterLists();
            const result = await response.json();
            if (result.success) {
                setData(result.data);
            } else {
                setError(result.message || 'Failed to fetch master lists');
            }
        } catch (err) {
            setError('Error connecting to server');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(item =>
        item.pattern_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.part_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Selection Handlers
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = new Set(filteredData.map(item => item.id));
            setSelectedItems(allIds);
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleSelectItem = (id: number) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    // Delete Handlers
    const handleDeleteClick = () => {
        const selectedIds = Array.from(selectedItems);
        const selectedNames = data
            .filter(item => selectedIds.includes(item.id))
            .map(item => item.pattern_code);

        setItemsToDelete({
            ids: selectedIds,
            names: selectedNames
        });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemsToDelete) return;

        try {
            setDeleteLoading(true);
            await masterListService.deleteMasterLists(itemsToDelete.ids);

            // Refresh data and clear selection
            await fetchData();
            setSelectedItems(new Set());
            setShowDeleteModal(false);
            setItemsToDelete(null);
        } catch (err: any) {
            setError(err.message || 'Failed to delete items');
            setShowDeleteModal(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h6">Master List Entries</Typography>
                    {selectedItems.size > 0 && (
                        <button
                            onClick={handleDeleteClick}
                            style={{
                                padding: '6px 16px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                            Delete Selected ({selectedItems.size})
                        </button>
                    )}
                </Box>
                <TextField
                    size="small"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Box>
            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#eee' }}>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={filteredData.length > 0 && selectedItems.size === filteredData.length}
                                    indeterminate={selectedItems.size > 0 && selectedItems.size < filteredData.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell><b>Pattern Code</b></TableCell>
                            <TableCell><b>Part Name</b></TableCell>
                            <TableCell><b>Material Grade</b></TableCell>
                            <TableCell align="center"><b>Actions</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((row, index) => (
                                <TableRow
                                    key={row.id || index}
                                    hover
                                    selected={selectedItems.has(row.id)}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedItems.has(row.id)}
                                            onChange={() => handleSelectItem(row.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{row.pattern_code}</TableCell>
                                    <TableCell>{row.part_name}</TableCell>
                                    <TableCell>{row.material_grade}</TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                                            <EditIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No data found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <DeleteMasterModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                loading={deleteLoading}
                itemName={itemsToDelete?.names[0]}
                count={itemsToDelete?.ids.length}
            />
        </Paper>
    );
};

export default MasterListTable;
