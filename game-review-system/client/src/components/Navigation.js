import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add, Dashboard as DashboardIcon } from '@mui/icons-material';

const Navigation = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Game Design Review System
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/')}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/create')}
          >
            Create Issue
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;