import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const BonusPoints = () => {
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState(0);
  const [log, setLog] = useState([
    { message: "Bonus Account created", date: "Dec. 26, 2024" },
  ]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleAddPoints = (newPoints) => {
    setPoints(points + parseInt(newPoints, 10));
    setLog((prev) => [
      ...prev,
      { message: `Added ${newPoints} points`, date: new Date().toLocaleDateString() },
    ]);
    handleClose();
  };

  return (
    <Box display="flex" flexDirection="column" gap={2} p={2}>
      {/* Bonus Points Card */}
      <Box display="flex" gap={2}>
        <Card
          sx={{
            width: 300,
            p: 2,
            border: "1px solid #ddd",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <CardContent>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                border: "2px solid #ddd",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
              src={"/path-to-your-uploaded-image/Screenshot-2025-01-09-100335.png"} // Update the path here
            />
               <Button
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{ mt: 1, color: "red" }}
            >
              Add Points
            </Button>
            <Typography variant="h6" gutterBottom>
              Bonus Points
            </Typography>

            
            <Typography variant="subtitle1">hussam r (PEP00)</Typography>
            <Typography variant="body2">S/W Dept / None</Typography>
            <Box mt={2}>
              <Typography variant="body1">Balance points to redeem:</Typography>
              <Typography variant="h4">{points}</Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={() => alert("Redeem feature coming soon!")}
              sx={{ mt: 2 }}
            >
              Redeem Now
            </Button>
         
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Box flex={1}>
          <Typography variant="body1" gutterBottom>
            Activity Log
          </Typography>
          {log.map((entry, index) => (
            <Box key={index} display="flex" justifyContent="space-between">
              <Typography variant="body2">{`--> ${entry.message}`}</Typography>
              <Typography variant="caption" color="text.secondary">
                {entry.date}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Add Points Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add Bonus Points</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="points"
            label="Points to Add"
            type="number"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={() =>
              handleAddPoints(document.getElementById("points").value)
            }
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BonusPoints;
