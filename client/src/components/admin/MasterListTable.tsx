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
import LoadingSpinner from '../common/LoadingSpinner';

interface MasterListTableProps {
    onEdit: (data: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const MasterListTable: React.FC<MasterListTableProps> = ({ onEdit }) => {
    const [data, setData] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
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
            const result = await masterListService.getAllMasterLists();
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
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message || 'Failed to delete items');
            setShowDeleteModal(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    // Bulk Status Handlers
    const handleBulkStatusChange = async (status: boolean) => {
        try {
            const selectedIds = Array.from(selectedItems);
            for (const id of selectedIds) {
                await masterListService.toggleStatus(id, status);
            }
            // Refresh data and clear selection
            await fetchData();
            setSelectedItems(new Set());
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setError(err.message || `Failed to update status`);
        }
    };

    if (loading) return <Box display="flex" justifyContent="center" p={4}><LoadingSpinner /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                    {selectedItems.size > 0 && (
                        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                            <button
                                onClick={() => handleBulkStatusChange(true)}
                                style={{
                                    padding: '6px 16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                            >
                                âœ“ Activate ({selectedItems.size})
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange(false)}
                                style={{
                                    padding: '6px 16px',
                                    backgroundColor: '#ffc107',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0a800')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffc107')}
                            >
                                âœ• Deactivate ({selectedItems.size})
                            </button>
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
                                    gap: '5px',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
                            >
                                <DeleteIcon fontSize="small" />
                                Delete ({selectedItems.size})
                            </button>
                        </Box>
                    )}
                </Box>
                <TextField
                    size="small"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Box>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#eee' }}>
                            <TableCell padding="checkbox" sx={{ backgroundColor: '#eee', position: 'sticky', top: 0, zIndex: 10 }}>
                                <Checkbox
                                    checked={filteredData.length > 0 && selectedItems.size === filteredData.length}
                                    indeterminate={selectedItems.size > 0 && selectedItems.size < filteredData.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell sx={{ backgroundColor: '#eee', position: 'sticky', top: 0, zIndex: 10 }}><b>Pattern Code</b></TableCell>
                            <TableCell sx={{ backgroundColor: '#eee', position: 'sticky', top: 0, zIndex: 10 }}><b>Part Name</b></TableCell>
                            <TableCell sx={{ backgroundColor: '#eee', position: 'sticky', top: 0, zIndex: 10 }}><b>Material Grade</b></TableCell>
                            <TableCell align="center" sx={{ backgroundColor: '#eee', position: 'sticky', top: 0, zIndex: 10 }}><b>Status</b></TableCell>
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
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    const newStatus = !row.is_active;
                                                    await masterListService.toggleStatus(row.id, newStatus);
                                                    await fetchData(); // Refresh list
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Failed to update status');
                                                }
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                backgroundColor: (row.is_active === true || Number(row.is_active) === 1) ? '#e6f4ea' : '#fce8e6',
                                                color: (row.is_active === true || Number(row.is_active) === 1) ? '#1e7e34' : '#c62828',
                                                transition: 'all 0.2s',
                                                marginRight: '8px'
                                            }}
                                        >
                                            {(row.is_active === true || Number(row.is_active) === 1) ? 'Active' : 'Inactive'}
                                        </button>
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
