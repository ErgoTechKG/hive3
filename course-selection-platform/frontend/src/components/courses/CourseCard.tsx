import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  Person,
  Schedule,
  LocationOn,
  School,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { Course } from '../../types';

interface CourseCardProps {
  course: Course;
  compact?: boolean;
  showActions?: boolean;
  onEnroll?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  compact = false,
  showActions = true,
  onEnroll,
}) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'pending_approval':
        return 'warning';
      case 'draft':
        return 'default';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  const capacityPercentage = (course.enrolled / course.capacity) * 100;

  if (compact) {
    return (
      <Card sx={{ cursor: 'pointer' }} onClick={() => navigate(`/courses/${course._id}`)}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="start">
            <Box flex={1}>
              <Typography variant="subtitle1" gutterBottom>
                {course.nameCn}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {course.courseId} | {typeof course.professor === 'object' ? course.professor.nameCn : '未分配'}
              </Typography>
              <Box display="flex" gap={1} mt={1}>
                <Chip label={`${course.credits} 学分`} size="small" />
                <Chip 
                  label={`${course.enrolled}/${course.capacity}`} 
                  size="small"
                  color={capacityPercentage >= 90 ? 'error' : 'primary'}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {course.nameCn}
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              {course.nameEn}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              课程编号：{course.courseId}
            </Typography>
          </Box>
          <Chip
            label={course.status}
            size="small"
            color={getStatusColor(course.status)}
          />
        </Box>

        <Typography variant="body2" paragraph>
          {course.descriptionCn}
        </Typography>

        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2">
              教授：{typeof course.professor === 'object' ? course.professor.nameCn : '未分配'}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <School fontSize="small" color="action" />
            <Typography variant="body2">
              学分：{course.credits} | 容量：{course.enrolled}/{course.capacity}
            </Typography>
          </Box>

          {course.schedule && course.schedule.length > 0 && course.schedule[0] && (
            <Box display="flex" alignItems="center" gap={1}>
              <Schedule fontSize="small" color="action" />
              <Typography variant="body2">
                {course.schedule[0].dayOfWeek === 1 ? '周一' : 
                 course.schedule[0].dayOfWeek === 2 ? '周二' :
                 course.schedule[0].dayOfWeek === 3 ? '周三' :
                 course.schedule[0].dayOfWeek === 4 ? '周四' :
                 course.schedule[0].dayOfWeek === 5 ? '周五' : '周末'} {' '}
                {course.schedule[0].startTime} - {course.schedule[0].endTime}
              </Typography>
            </Box>
          )}

          {course.schedule && course.schedule[0]?.location && (
            <Box display="flex" alignItems="center" gap={1}>
              <LocationOn fontSize="small" color="action" />
              <Typography variant="body2">
                {course.schedule[0].location}
              </Typography>
            </Box>
          )}
        </Box>

        {course.tags && course.tags.length > 0 && (
          <Box display="flex" gap={0.5} mt={2} flexWrap="wrap">
            {course.tags.map((tag: string, index: number) => (
              <Chip key={index} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        )}

        <Box mt={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="caption" color="textSecondary">
              选课进度
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {Math.round(capacityPercentage)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={capacityPercentage}
            color={capacityPercentage >= 90 ? 'error' : 'primary'}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      </CardContent>

      {showActions && (
        <CardActions>
          <Button
            size="small"
            onClick={() => navigate(`/courses/${course._id}`)}
          >
            查看详情
          </Button>
          {course.status === 'published' && onEnroll && (
            <Button
              size="small"
              color="primary"
              onClick={onEnroll}
              disabled={course.enrolled >= course.capacity}
            >
              {course.enrolled >= course.capacity ? '已满' : '选课'}
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default CourseCard;