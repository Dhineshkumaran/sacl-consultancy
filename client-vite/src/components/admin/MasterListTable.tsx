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
    Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { masterListService } from '../../services/masterListService';

interface MasterListTableProps {
    onEdit: (data: any) => void;
}

const MasterListTable: React.FC<MasterListTableProps> = ({ onEdit }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Master List Entries</Typography>
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
                            <TableCell><b>Pattern Code</b></TableCell>
                            <TableCell><b>Part Name</b></TableCell>
                            <TableCell><b>Material Grade</b></TableCell>
                            <TableCell align="center"><b>Actions</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.length > 0 ? (
                            filteredData.map((row, index) => (
                                <TableRow key={row.id || index} hover>
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
                                <TableCell colSpan={4} align="center">No data found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default MasterListTable;
