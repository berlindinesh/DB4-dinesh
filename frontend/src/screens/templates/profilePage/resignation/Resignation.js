import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Avatar,
  TextField,
  Grid,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EmailIcon from "@mui/icons-material/Email";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const Resignation = () => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [cards, setCards] = useState([
    {
      name: "Hussam R",
      department: "S/W Dept",
      designation: "Associate",
      status: "Approved",
      comments: "jednk",
    },
    {
      name: "Hussam R",
      department: "S/W Dept",
      designation: "Test",
      status: "Approved",
      comments: "testst",
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    department: "",
    designation: "",
    status: "Requested",
    comments: "",
  });

  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setFormData({
      name: "",
      department: "",
      designation: "",
      status: "Requested",
      comments: "",
    });
    setEditMode(false);
    setEditIndex(null);
    setOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (editMode) {
      setCards((prev) => prev.map((card, index) => (index === editIndex ? formData : card)));
    } else {
      setCards((prev) => [...prev, formData]);
    }
    handleClose();
  };

  const handleEdit = (index) => {
    setEditMode(true);
    setEditIndex(index);
    setFormData(cards[index]);
    setOpen(true);
  };

  const handleDelete = (index) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" mb={3}>
        Resignation Management
      </Typography>
      <Button
        variant="contained"
        color="error"
        startIcon={<AddIcon />}
        onClick={handleOpen}
        sx={{ mb: 3 }}
      >
        Create
      </Button>

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar sx={{ mr: 2 }}>HR</Avatar>
                  <Box>
                    <Typography variant="h6">{card.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {card.department} / {card.designation}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  color={
                    card.status === "Approved"
                      ? "green"
                      : card.status === "Rejected"
                      ? "red"
                      : "orange"
                  }
                >
                  {card.status}
                </Typography>
                <Typography variant="body2" mt={2}>
                  {card.comments}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "space-between" }}>
                <Button size="small" startIcon={<EmailIcon />} color="primary">
                  Email
                </Button>
                <Box>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    color="warning"
                    onClick={() => handleEdit(index)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </Button>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editMode ? "Edit Resignation" : "Add Resignation"}</DialogTitle>
        <DialogContent>
          <TextField label="Name" name="name" fullWidth margin="normal" value={formData.name} onChange={handleChange} />
          <TextField label="Department" name="department" fullWidth margin="normal" value={formData.department} onChange={handleChange} />
          <TextField label="Designation" name="designation" fullWidth margin="normal" value={formData.designation} onChange={handleChange} />
          <Select name="status" fullWidth value={formData.status} onChange={handleChange} sx={{ mt: 2 }}>
            <MenuItem value="Requested">Requested</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
          <TextField label="Comments" name="comments" fullWidth margin="normal" multiline rows={3} value={formData.comments} onChange={handleChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Resignation;
