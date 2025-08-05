import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import { TrendingUp, TrendingDown, ArrowForward } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  trend?: string;
  suffix?: string;
  action?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  trend,
  suffix,
  action,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    const isPositive = trend.startsWith('+');
    return isPositive ? (
      <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
    ) : (
      <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
    );
  };

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="subtitle2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ mb: trend ? 1 : 0 }}>
              {value}{suffix}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" gap={0.5}>
                {getTrendIcon()}
                <Typography
                  variant="caption"
                  color={trend.startsWith('+') ? 'success.main' : 'error.main'}
                >
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ color: `${color}.main` }}>{icon}</Box>
          </Box>
        </Box>
        
        {action && (
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
            }}
            onClick={action}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;