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
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Badge,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
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
  Add,
  Edit,
  Visibility,
  PersonAdd,
  Message,
  Assessment,
  CloudUpload,
  LibraryBooks,
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
import CourseCard from '../../components/courses/CourseCard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ProfessorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedTab, setSelectedTab] = useState(0);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ approved: true, comment: '' });

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'professorDashboard',
    analyticsService.getDashboardStats
  );

  const { data: myCourses, isLoading: coursesLoading } = useQuery(
    ['myCourses', user?._id],
    () => courseService.getMyCourses()
  );

  const { data: pendingReviews } = useQuery(
    'pendingReviews',
    () => enrollmentService.getPendingReviews()
  );

  const { data: courseStats } = useQuery(
    ['courseStats', myCourses?.data?.[0]?._id],
    () => myCourses?.data?.[0]?._id ? 
      courseService.getCourseStatistics(myCourses.data[0]._id) : 
      Promise.resolve(null),
    { enabled: !!myCourses?.data?.[0]?._id }
  );

  // Mutations
  const reviewMutation = useMutation(
    ({ enrollmentId, approved, comment }: any) => 
      enrollmentService.reviewApplication(enrollmentId, approved, comment),
    {
      onSuccess: () => {
        enqueueSnackbar('学生申请已处理', { variant: 'success' });
        setReviewDialog(false);
      },
    }
  );

  const handleReviewSubmit = () => {
    if (selectedStudent) {
      reviewMutation.mutate({
        enrollmentId: selectedStudent.enrollmentId,
        ...reviewForm,
      });
    }
  };

  if (dashboardLoading || coursesLoading) {
    return <LinearProgress />;
  }

  const stats = dashboardData?.data  || {};
  const weeklyActivity = dashboardData?.data  || [];
  const studentPerformance = dashboardData?.data || [];

  // Course enrollment trend data
  const enrollmentTrendData = (weeklyActivity as any[]).map((item: any) => ({
    date: format(new Date(item.date), 'MM-dd'),
    applications: item.applications,
    confirmed: item.confirmed,
  }));

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          教学管理中心
        </Typography>
        <Typography variant="body1" color="textSecondary">
          欢迎回来，{user?.nameCn} 教授
        </Typography>
      </Box>

      {/* Alerts */}
      {pendingReviews?.data && pendingReviews.data.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          您有 {pendingReviews.data.length} 个待审核的学生申请
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="我的课程"
            value={(stats as any)?.totalCourses || 0}
            icon={<School />}
            color="primary"
            action={() => navigate('/courses/professor/' + user?._id)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="学生总数"
            value={(stats as any)?.totalStudents || 0}
            icon={<Group />}
            color="success"
            trend={(stats as any)?.studentTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="待审申请"
            value={(stats as any)?.pendingApplications || 0}
            icon={<PersonAdd />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="平均评分"
            value={(stats as any)?.averageRating || 0}
            icon={<Assessment />}
            color="info"
            suffix="/5"
          />
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label="课程管理" />
          <Tab label="学生申请" />
          <Tab label="教学分析" />
          <Tab label="课程资料" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">我的课程</Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/courses/create')}
                  >
                    创建新课程
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {myCourses?.data?.map((course: any) => (
                    <Grid item xs={12} key={course._id}>
                      <Paper elevation={1} sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="start">
                          <Box flex={1}>
                            <Typography variant="h6">{course.nameCn}</Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              {course.courseId} | {course.semester}
                            </Typography>
                            <Box display="flex" gap={2} mt={1}>
                              <Chip 
                                label={`${course.enrolled}/${course.capacity} 已选`}
                                size="small"
                                color={course.enrolled >= course.capacity ? 'error' : 'primary'}
                              />
                              <Chip 
                                label={`${course.credits} 学分`}
                                size="small"
                              />
                              <Chip 
                                label={course.status}
                                size="small"
                                color={course.status === 'published' ? 'success' : 'default'}
                              />
                            </Box>
                          </Box>
                          <Box>
                            <IconButton onClick={() => navigate(`/courses/${course._id}`)}>
                              <Visibility />
                            </IconButton>
                            <IconButton onClick={() => navigate(`/courses/${course._id}/edit`)}>
                              <Edit />
                            </IconButton>
                          </Box>
                        </Box>

                        {course.status === 'published' && (
                          <Box mt={2}>
                            <LinearProgress 
                              variant="determinate" 
                              value={(course.enrolled / course.capacity) * 100}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                              选课进度：{Math.round((course.enrolled / course.capacity) * 100)}%
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {(!myCourses?.data || myCourses.data.length === 0) && (
                  <Box textAlign="center" py={5}>
                    <LibraryBooks sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                    <Typography color="textSecondary" gutterBottom>
                      您还没有创建任何课程
                    </Typography>
                    <Button 
                      variant="outlined" 
                      startIcon={<Add />}
                      onClick={() => navigate('/courses/create')}
                    >
                      创建第一门课程
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Enrollment Trend */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  选课趋势
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={enrollmentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#8884d8" 
                      name="申请数"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confirmed" 
                      stroke="#82ca9d" 
                      name="确认数"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Quick Actions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  快速操作
                </Typography>
                <List>
                  <ListItem button onClick={() => navigate('/courses/create')}>
                    <ListItemText primary="创建新课程" />
                    <Add />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/tasks/create')}>
                    <ListItemText primary="发布任务" />
                    <Assignment />
                  </ListItem>
                  <ListItem button onClick={() => setSelectedTab(3)}>
                    <ListItemText primary="上传资料" />
                    <CloudUpload />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/analytics/courses')}>
                    <ListItemText primary="查看分析" />
                    <Assessment />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Course Statistics */}
            {courseStats && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    课程统计
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="报名人数" />
                      <Typography variant="h6">
                        {courseStats?.data?.totalApplications || 0}
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="选中率" />
                      <Typography variant="h6" color="primary">
                        {courseStats?.data?.enrollmentRate || 0}%
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="退选率" />
                      <Typography variant="h6" color="error">
                        {courseStats?.data?.dropRate || 0}%
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="平均成绩" />
                      <Typography variant="h6">
                        {courseStats?.data?.averageGrade || 'N/A'}
                      </Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              待审核学生申请
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>学生姓名</TableCell>
                    <TableCell>学号</TableCell>
                    <TableCell>申请课程</TableCell>
                    <TableCell>志愿排名</TableCell>
                    <TableCell>申请理由</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingReviews?.data?.map((review: any) => (
                    <TableRow key={review._id}>
                      <TableCell>{review.student.nameCn}</TableCell>
                      <TableCell>{review.student.userId}</TableCell>
                      <TableCell>{review.course.nameCn}</TableCell>
                      <TableCell>
                        <Chip label={`第 ${review.rank} 志愿`} size="small" />
                      </TableCell>
                      <TableCell>{review.reason || '无'}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setSelectedStudent(review);
                            setReviewDialog(true);
                          }}
                        >
                          审核
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {(!pendingReviews?.data || pendingReviews.data.length === 0) && (
              <Box textAlign="center" py={5}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography color="textSecondary">
                  暂无待审核申请
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>审核学生申请</DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                学生：{selectedStudent.student.nameCn} ({selectedStudent.student.userId})
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                申请课程：{selectedStudent.course.nameCn}
              </Typography>
              <Typography variant="body2" paragraph>
                申请理由：{selectedStudent.reason || '无'}
              </Typography>

              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  审核决定
                </Typography>
                <Box display="flex" gap={2} mb={2}>
                  <Button
                    variant={reviewForm.approved ? 'contained' : 'outlined'}
                    color="success"
                    onClick={() => setReviewForm({ ...reviewForm, approved: true })}
                  >
                    批准
                  </Button>
                  <Button
                    variant={!reviewForm.approved ? 'contained' : 'outlined'}
                    color="error"
                    onClick={() => setReviewForm({ ...reviewForm, approved: false })}
                  >
                    拒绝
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="审核意见"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="请输入审核意见..."
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>取消</Button>
          <Button onClick={handleReviewSubmit} variant="contained" color="primary">
            提交审核
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessorDashboard;