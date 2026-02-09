import React, { useState, useEffect } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Alert,
    TextField,
    Box,
    Checkbox,
    Button,
    Stack,
    InputAdornment,
    Typography
} from '@mui/material';
import { masterListService } from '../../services/masterListService';
import LoadingState from '../common/LoadingState';
import Swal from 'sweetalert2';

interface MasterListTableProps {
    onEdit: (data: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const MasterListTable: React.FC<MasterListTableProps> = ({ onEdit }) => {
    const [data, setData] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Selection state
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

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
    const handleDeleteClick = async () => {
        const selectedIds = Array.from(selectedItems);
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: 'Delete Selected Items?',
            text: `You are about to delete ${selectedIds.length} item(s) from the master list. This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete all!'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const response = await masterListService.deleteMasterLists(selectedIds);
                if (response.success) {
                    Swal.fire('Deleted!', `${selectedIds.length} item(s) have been deleted.`, 'success');
                    await fetchData();
                    setSelectedItems(new Set());
                } else {
                    Swal.fire('Failed!', response.message || 'Failed to delete items.', 'error');
                }
            } catch (error: any) {
                console.error("Error during bulk delete:", error);
                Swal.fire('Error!', error.message || 'An error occurred during bulk deletion.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBulkStatusChange = async (status: boolean) => {
        try {
            const selectedIds = Array.from(selectedItems);
            for (const id of selectedIds) {
                await masterListService.toggleStatus(id, status);
            }
            // Refresh data and clear selection
            await fetchData();
            setSelectedItems(new Set());
            Swal.fire({
                title: 'Success',
                text: `Successfully ${status ? 'activated' : 'deactivated'} ${selectedIds.length} items.`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            Swal.fire({
                title: 'Error',
                text: err.message || `Failed to update status`,
                icon: 'error',
                confirmButtonColor: '#d33'
            });
        }
    };

    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                    {selectedItems.size > 0 && (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<CheckCircleIcon fontSize="small" />}
                                onClick={() => handleBulkStatusChange(true)}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1 }}
                            >
                                Activate ({selectedItems.size})
                            </Button>
                            <Button
                                variant="contained"
                                color="warning"
                                size="small"
                                startIcon={<CancelIcon fontSize="small" />}
                                onClick={() => handleBulkStatusChange(false)}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1, color: 'white' }}
                            >
                                Deactivate ({selectedItems.size})
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                startIcon={<DeleteIcon fontSize="small" />}
                                onClick={handleDeleteClick}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1 }}
                            >
                                Delete ({selectedItems.size})
                            </Button>
                        </Stack>
                    )}
                </Box>
                <TextField
                    size="small"
                    placeholder="Search master list..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 250, bgcolor: 'white' }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#95a5a6', fontSize: '1.2rem' }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>
            <TableContainer className="premium-table-container" sx={{ maxHeight: 'calc(100vh - 300px)', overflow: 'auto', position: 'relative', minHeight: loading || filteredData.length === 0 ? '300px' : 'auto' }}>
                {loading ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: 'rgba(255,255,255,0.7)',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10,
                        borderRadius: '12px',
                        backdropFilter: 'blur(2px)'
                    }}>
                        <LoadingState message="Loading master list..." />
                    </Box>
                ) : null}
                <Table size="small" stickyHeader>
                    <TableHead className="premium-table-head">
                        <TableRow>
                            <TableCell padding="checkbox" className="premium-table-header-cell" sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <Checkbox
                                    checked={filteredData.length > 0 && selectedItems.size === filteredData.length}
                                    indeterminate={selectedItems.size > 0 && selectedItems.size < filteredData.length}
                                    onChange={handleSelectAll}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell className="premium-table-header-cell" sx={{ position: 'sticky', top: 0, zIndex: 10 }}>PATTERN CODE</TableCell>
                            <TableCell className="premium-table-header-cell" sx={{ position: 'sticky', top: 0, zIndex: 10 }}>PART NAME</TableCell>
                            <TableCell className="premium-table-header-cell" sx={{ position: 'sticky', top: 0, zIndex: 10 }}>GRADE</TableCell>
                            <TableCell align="center" className="premium-table-header-cell" sx={{ position: 'sticky', top: 0, zIndex: 10 }}>STATUS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((row, index) => (
                                <TableRow
                                    key={row.id || index}
                                    className="premium-table-row"
                                    selected={selectedItems.has(row.id)}
                                >
                                    <TableCell padding="checkbox" className="premium-table-cell">
                                        <Checkbox
                                            checked={selectedItems.has(row.id)}
                                            onChange={() => handleSelectItem(row.id)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell className="premium-table-cell-bold">{row.pattern_code}</TableCell>
                                    <TableCell className="premium-table-cell">{row.part_name}</TableCell>
                                    <TableCell className="premium-table-cell">{row.material_grade}</TableCell>
                                    <TableCell align="center" className="premium-table-cell">
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <span
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        const newStatus = !row.is_active;
                                                        await masterListService.toggleStatus(row.id, newStatus);
                                                        await fetchData();
                                                        Swal.fire({
                                                            title: 'Success',
                                                            text: `Successfully ${newStatus ? 'activated' : 'deactivated'} item.`,
                                                            icon: 'success',
                                                            timer: 2000,
                                                            showConfirmButton: false
                                                        });
                                                    } catch (err: any) {
                                                        Swal.fire({
                                                            title: 'Error',
                                                            text: err.message || `Failed to update status`,
                                                            icon: 'error',
                                                            confirmButtonColor: '#d33'
                                                        });
                                                    }
                                                }}
                                                className={`status-pill ${(row.is_active === true || Number(row.is_active) === 1) ? 'status-pill-active' : 'status-pill-inactive'}`}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {(row.is_active === true || Number(row.is_active) === 1) ? (
                                                    <><CheckCircleIcon sx={{ fontSize: '13px' }} /> Active</>
                                                ) : (
                                                    <><CancelIcon sx={{ fontSize: '13px' }} /> Inactive</>
                                                )}
                                            </span>
                                            <IconButton
                                                size="small"
                                                onClick={() => onEdit(row)}
                                                sx={{
                                                    color: '#3498db',
                                                    '&:hover': { bgcolor: '#ebf5fb' }
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center" className="premium-table-cell" sx={{ py: 12, color: '#94a3b8' }}>
                                    No data found matching your search.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' }, color: 'text.secondary', textAlign: 'center', mt: 1 }}>
                Swipe to view more
            </Typography>

            {/* Modal removed as it is replaced by SweetAlert2 */}
        </Box>
    );
};

export default MasterListTable;
