import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Warning,
  Info,
  ArrowForward,
  AttachFile,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface TaskListItemProps {
  task: any;
  showSender?: boolean;
  onAction?: () => void;
}

const TaskListItem: React.FC<TaskListItemProps> = ({
  task,
  showSender = true,
  onAction,
}) => {
  const navigate = useNavigate();

  const getTaskIcon = () => {
    switch (task.type) {
      case 'read':
        return <Info />;
      case 'action':
        return <Assignment />;
      case 'approval':
        return <CheckCircle />;
      default:
        return <Assignment />;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'primary';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'overdue':
        return 'error';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && 
                   !['completed', 'rejected'].includes(task.status);

  return (
    <ListItem
      button
      onClick={() => onAction ? onAction() : navigate(`/tasks/${task._id}`)}
      sx={{
        borderLeft: 4,
        borderColor: `${getPriorityColor()}.main`,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: `${getPriorityColor()}.light` }}>
          {getTaskIcon()}
        </Avatar>
      </ListItemAvatar>

      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="subtitle2">
              {task.title}
            </Typography>
            {task.attachments && task.attachments.length > 0 && (
              <AttachFile fontSize="small" color="action" />
            )}
            {isOverdue && (
              <Warning fontSize="small" color="error" />
            )}
          </Box>
        }
        secondary={
          <Box>
            {showSender && (
              <Typography variant="caption" color="textSecondary">
                发送者：{task.sender?.nameCn} | 
              </Typography>
            )}
            {task.deadline && (
              <Typography variant="caption" color={isOverdue ? 'error' : 'textSecondary'}>
                {' '}截止：{format(new Date(task.deadline), 'MM月dd日 HH:mm', { locale: zhCN })}
              </Typography>
            )}
            {task.relatedCourse && (
              <Typography variant="caption" color="textSecondary">
                {' '}| 相关课程：{task.relatedCourse.nameCn}
              </Typography>
            )}
          </Box>
        }
      />

      <ListItemSecondaryAction>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={task.type === 'read' ? '阅读' : 
                   task.type === 'action' ? '行动' : '审批'}
            size="small"
            variant="outlined"
          />
          <Chip
            label={task.status === 'pending' ? '待处理' :
                   task.status === 'read' ? '已读' :
                   task.status === 'in_progress' ? '进行中' :
                   task.status === 'completed' ? '已完成' :
                   task.status === 'overdue' ? '已逾期' : '已拒绝'}
            size="small"
            color={getStatusColor()}
          />
          <IconButton size="small">
            <ArrowForward fontSize="small" />
          </IconButton>
        </Box>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default TaskListItem;