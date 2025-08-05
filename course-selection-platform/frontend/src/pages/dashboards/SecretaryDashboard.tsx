import React, { useState } from 'react';
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
  Tab,
  Tabs,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Badge,
  Menu,
  MenuItem,
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
  PlayArrow,
  Pause,
  Settings,
  People,
  Timeline,
  Assessment,
  MoreVert,
  Publish,
  Archive,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { RootState } from '../../store';
import analyticsService from '../../services/analyticsService';
import courseService from '../../services/courseService';
import enrollmentService from '../../services/enrollmentService';
import taskService from '../../services/taskService';
import StatCard from '../../components/common/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const SecretaryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'secretaryDashboard',
    analyticsService.getDashboardStats
  );

  const { data: pendingCourses, isLoading: coursesLoading } = useQuery(
    ['courses', 'pending'],
    () => courseService.getCourses({ status: 'pending_approval' })
  );

  const { data: enrollmentStats } = useQuery(
    ['enrollmentStats', '2025-Spring'],
    () => enrollmentService.getEnrollmentStatistics('2025-Spring')
  );

  const { data: unassignedStudents } = useQuery(
    'unassignedStudents',
    () => analyticsService.getUnassignedStudents()
  );

  // Mutations
  const approveMutation = useMutation(
    ({ courseId, approved }: any) => courseService.approveCourse(courseId, approved),
    {
      onSuccess: () => {
        enqueueSnackbar('课程审批成功', { variant: 'success' });
      },
    }
  );

  const publishMutation = useMutation(
    (courseId: string) => courseService.publishCourse(courseId),
    {
      onSuccess: () => {
        enqueueSnackbar('课程发布成功', { variant: 'success' });
      },
    }
  );

  const runMatchingMutation = useMutation(
    () => enrollmentService.runMatchingAlgorithm({ semester: '2025-Spring' }),
    {
      onSuccess: () => {
        enqueueSnackbar('选课匹配算法已启动', { variant: 'success' });
      },
    }
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, course: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  if (dashboardLoading || coursesLoading) {
    return <LinearProgress />;
  }

  const stats = dashboardData?.stats || {};
  const workflowStatus = dashboardData?.workflowStatus || {};
  const departmentStats = dashboardData?.departmentStats || [];

  // Course status distribution for pie chart
  const courseStatusData = [
    { name: '草稿', value: stats.draftCourses || 0, color: '#9e9e9e' },
    { name: '待审批', value: stats.pendingApproval || 0, color: '#ff9800' },
    { name: '已批准', value: stats.approvedCourses || 0, color: '#2196f3' },
    { name: '已发布', value: stats.publishedCourses || 0, color: '#4caf50' },
  ];

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          运营管理中心
        </Typography>
        <Typography variant="body1" color="textSecondary">
          当前学期：2025年春季 | {format(new Date(), 'yyyy年MM月dd日')}
        </Typography>
      </Box>

      {/* Workflow Status Alert */}
      {workflowStatus.currentPhase && (
        <Alert 
          severity={workflowStatus.isOnSchedule ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
          action={
            workflowStatus.canProceed && (
              <Button 
                color="inherit" 
                size="small"
                onClick={() => runMatchingMutation.mutate()}
              >
                运行匹配
              </Button>
            )
          }
        >
          <Typography variant="subtitle2">
            当前阶段：{workflowStatus.currentPhase} | 
            进度：{workflowStatus.progress}% | 
            {workflowStatus.message}
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="待审批课程"
            value={stats.pendingApproval || 0}
            icon={<School />}
            color="warning"
            action={() => navigate('/courses?status=pending_approval')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="未分配学生"
            value={stats.unassignedStudents || 0}
            icon={<People />}
            color="error"
            trend={stats.unassignedTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="任务完成率"
            value={`${stats.taskCompletionRate || 0}%`}
            icon={<Assignment />}
            color="success"
            trend={stats.taskTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="系统负载"
            value={`${stats.systemLoad || 0}%`}
            icon={<Timeline />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label="课程审批" />
          <Tab label="选课管理" />
          <Tab label="任务分配" />
          <Tab label="数据统计" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">待审批课程列表</Typography>
                  <Badge badgeContent={pendingCourses?.data?.length || 0} color="error">
                    <Notifications />
                  </Badge>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>课程名称</TableCell>
                        <TableCell>教授</TableCell>
                        <TableCell>学分</TableCell>
                        <TableCell>容量</TableCell>
                        <TableCell>提交时间</TableCell>
                        <TableCell align="center">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingCourses?.data?.map((course: any) => (
                        <TableRow key={course._id}>
                          <TableCell>
                            <Typography variant="subtitle2">{course.nameCn}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {course.courseId}
                            </Typography>
                          </TableCell>
                          <TableCell>{course.professor.nameCn}</TableCell>
                          <TableCell>{course.credits}</TableCell>
                          <TableCell>{course.capacity}</TableCell>
                          <TableCell>
                            {format(new Date(course.createdAt), 'MM-dd HH:mm')}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, course)}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {(!pendingCourses?.data || pendingCourses.data.length === 0) && (
                  <Box textAlign="center" py={5}>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography color="textSecondary">
                      暂无待审批课程
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  课程状态分布
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={courseStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {courseStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  快速操作
                </Typography>
                <List>
                  <ListItem button onClick={() => navigate('/courses/create')}>
                    <ListItemText primary="创建新课程" />
                    <ArrowForward />
                  </ListItem>
                  <ListItem 
                    button 
                    onClick={() => publishMutation.mutate('batch')}
                    disabled={stats.approvedCourses === 0}
                  >
                    <ListItemText 
                      primary="批量发布课程" 
                      secondary={`${stats.approvedCourses || 0} 门待发布`}
                    />
                    <Publish />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/tasks/create')}>
                    <ListItemText primary="创建任务" />
                    <Assignment />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">选课流程管理</Typography>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => runMatchingMutation.mutate()}
                    disabled={!workflowStatus.canProceed}
                  >
                    运行匹配算法
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        选课进度统计
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="总学生数" />
                          <Typography variant="h6">{enrollmentStats?.totalStudents || 0}</Typography>
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="已提交志愿" />
                          <Typography variant="h6" color="primary">
                            {enrollmentStats?.submittedPreferences || 0}
                          </Typography>
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="未提交志愿" />
                          <Typography variant="h6" color="error">
                            {enrollmentStats?.pendingSubmissions || 0}
                          </Typography>
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="匹配成功率" />
                          <Typography variant="h6" color="success.main">
                            {enrollmentStats?.matchingRate || 0}%
                          </Typography>
                        </ListItem>
                      </List>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: 'background.default' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        未分配学生名单
                      </Typography>
                      <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {unassignedStudents?.data?.map((student: any) => (
                          <ListItem key={student._id}>
                            <ListItemText 
                              primary={`${student.nameCn} (${student.userId})`}
                              secondary={student.department}
                            />
                            <Button size="small" onClick={() => navigate(`/users/${student._id}`)}>
                              查看
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                      {unassignedStudents?.data?.length === 0 && (
                        <Typography variant="body2" color="textSecondary" align="center">
                          所有学生已分配课程
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/courses/${selectedCourse?._id}`);
          handleMenuClose();
        }}>
          查看详情
        </MenuItem>
        <MenuItem onClick={() => {
          approveMutation.mutate({ courseId: selectedCourse?._id, approved: true });
          handleMenuClose();
        }}>
          批准课程
        </MenuItem>
        <MenuItem onClick={() => {
          approveMutation.mutate({ courseId: selectedCourse?._id, approved: false });
          handleMenuClose();
        }}>
          拒绝课程
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SecretaryDashboard;