import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';
import {
  School,
  Assignment,
  Schedule,
  Notifications,
  TrendingUp,
  Group,
  ArrowForward,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import analyticsService from '../../services/analyticsService';
import enrollmentService from '../../services/enrollmentService';
import taskService from '../../services/taskService';
import StatCard from '../../components/common/StatCard';
import CourseCard from '../../components/courses/CourseCard';
import TaskListItem from '../../components/tasks/TaskListItem';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedTab, setSelectedTab] = useState(0);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'studentDashboard',
    analyticsService.getDashboardStats
  );

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery(
    ['enrollments', user?._id],
    () => enrollmentService.getMyEnrollments()
  );

  const { data: tasks, isLoading: tasksLoading } = useQuery(
    ['tasks', 'pending'],
    () => taskService.getMyTasks({ status: 'pending' })
  );

  const { data: recommendations } = useQuery(
    'courseRecommendations',
    analyticsService.getCourseRecommendations
  );

  if (dashboardLoading || enrollmentsLoading || tasksLoading) {
    return <LinearProgress />;
  }

  const stats = dashboardData?.stats || {};
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || [];
  const recentActivities = dashboardData?.recentActivities || [];

  // Enrollment status data for pie chart
  const enrollmentStatusData = [
    { name: '已选中', value: stats.selectedCourses || 0, color: '#4caf50' },
    { name: '待确认', value: stats.pendingConfirmation || 0, color: '#ff9800' },
    { name: '候补', value: stats.waitlisted || 0, color: '#2196f3' },
  ];

  return (
    <Box>
      {/* Welcome Section */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          欢迎回来，{user?.nameCn}！
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
        </Typography>
      </Box>

      {/* Important Alerts */}
      {upcomingDeadlines.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            紧急提醒：您有 {upcomingDeadlines.length} 个即将到期的任务！
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="已选课程"
            value={stats.enrolledCourses || 0}
            icon={<School />}
            color="primary"
            trend={stats.enrolledTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="待办任务"
            value={stats.pendingTasks || 0}
            icon={<Assignment />}
            color="warning"
            action={() => navigate('/tasks')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="学习小组"
            value={stats.studyGroups || 0}
            icon={<Group />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="本周学时"
            value={stats.weeklyHours || 0}
            icon={<Schedule />}
            color="info"
            suffix="小时"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Course Selection Status */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">选课状态</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/enrollments/status')}
                >
                  查看全部
                </Button>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      当前学期：2025年春季
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {stats.totalCredits || 0} 学分
                    </Typography>
                  </Box>

                  <List dense>
                    {enrollments?.data?.slice(0, 3).map((enrollment: any) => (
                      <ListItem key={enrollment._id}>
                        <ListItemText
                          primary={enrollment.course.nameCn}
                          secondary={`${enrollment.course.credits} 学分`}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={enrollment.status}
                            size="small"
                            color={enrollment.status === 'confirmed' ? 'success' : 'warning'}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={enrollmentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {enrollmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>

              {stats.pendingConfirmation > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  您有 {stats.pendingConfirmation} 门课程待确认，请尽快处理！
                  <Button
                    size="small"
                    sx={{ ml: 2 }}
                    onClick={() => navigate('/enrollments/status')}
                  >
                    立即确认
                  </Button>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">待办任务</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/tasks')}
                >
                  查看全部
                </Button>
              </Box>

              <List>
                {tasks?.data?.slice(0, 5).map((task: any) => (
                  <TaskListItem key={task._id} task={task} />
                ))}
              </List>

              {(!tasks?.data || tasks.data.length === 0) && (
                <Box textAlign="center" py={3}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography color="textSecondary">
                    太棒了！您已完成所有任务
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Recommended Courses */}
          {recommendations?.data && recommendations.data.length > 0 && (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">推荐课程</Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/courses')}
                  >
                    浏览更多
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {recommendations.data.slice(0, 3).map((course: any) => (
                    <Grid item xs={12} key={course._id}>
                      <CourseCard course={course} compact />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Study Groups */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                学习小组
              </Typography>

              <List>
                {stats.studyGroups > 0 ? (
                  <>
                    <ListItem>
                      <Avatar sx={{ mr: 2 }}>A</Avatar>
                      <ListItemText
                        primary="算法学习小组"
                        secondary="5 名成员 · 本周三 19:00"
                      />
                    </ListItem>
                    <ListItem>
                      <Avatar sx={{ mr: 2 }}>M</Avatar>
                      <ListItemText
                        primary="机器学习研讨"
                        secondary="8 名成员 · 本周五 14:00"
                      />
                    </ListItem>
                  </>
                ) : (
                  <Box textAlign="center" py={3}>
                    <Group sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                    <Typography color="textSecondary" gutterBottom>
                      还未加入学习小组
                    </Typography>
                    <Button variant="outlined" size="small">
                      浏览小组
                    </Button>
                  </Box>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                最近动态
              </Typography>

              <List dense>
                {recentActivities.map((activity: any, index: number) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={activity.title}
                        secondary={format(new Date(activity.timestamp), 'MM-dd HH:mm')}
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              {recentActivities.length === 0 && (
                <Typography variant="body2" color="textSecondary" align="center">
                  暂无最近动态
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;