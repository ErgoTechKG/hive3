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
  ListItemIcon,
  LinearProgress,
  Alert,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Assignment,
  TrendingUp,
  Assessment,
  Description,
  MoreVert,
  Download,
  CloudDownload,
  Analytics,
  Flag,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import analyticsService from '../../services/analyticsService';
import courseService from '../../services/courseService';
import StatCard from '../../components/common/StatCard';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart,
} from 'recharts';

const LeaderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedTab, setSelectedTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'leaderDashboard',
    analyticsService.getDashboardStats
  );

  const { data: annualMetrics } = useQuery(
    ['annualMetrics', new Date().getFullYear()],
    () => analyticsService.getAnnualMetrics(new Date().getFullYear())
  );

  const { data: departmentComparison } = useQuery(
    'departmentComparison',
    analyticsService.getDepartmentComparison
  );

  const { data: courseQuality } = useQuery(
    'courseQualityMetrics',
    analyticsService.getCourseQualityMetrics
  );

  const { data: pendingApprovals } = useQuery(
    ['pendingApprovals', 'leader'],
    () => courseService.getPendingApprovals()
  );

  if (dashboardLoading) {
    return <LinearProgress />;
  }

  const stats = dashboardData?.data || {};
  const kpis = dashboardData?.data || {};
  const trends = dashboardData?.data || {};
  const alerts = dashboardData?.data || [];

  // Department performance data for radar chart
  const departmentPerformanceData = departmentComparison?.data?.map((dept: any) => ({
    department: dept.name,
    courseQuality: dept.courseQuality,
    studentSatisfaction: dept.studentSatisfaction,
    completionRate: dept.completionRate,
    innovationIndex: dept.innovationIndex,
    researchOutput: dept.researchOutput,
  })) || [];

  // Course distribution by credits
  const creditDistributionData = [
    { name: '1-2学分', value: (stats as any)?.lowCreditCourses || 0 },
    { name: '3-4学分', value: (stats as any)?.midCreditCourses || 0 },
    { name: '5-6学分', value: (stats as any)?.highCreditCourses || 0 },
  ];

  // Monthly trend data
  const monthlyTrendData = (trends as any)?.monthly?.map((item: any) => ({
    month: format(new Date(item.date), 'MMM', { locale: zhCN }),
    courses: item.courses,
    students: item.students,
    satisfaction: item.satisfaction,
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          战略管理仪表板
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {format(new Date(), 'yyyy年MM月dd日')} | 2025年春季学期
        </Typography>
      </Box>

      {/* System Alerts */}
      {(alerts as any)?.length > 0 && (
        <Box mb={3}>
          {(alerts as any)?.map((alert: any, index: number) => (
            <Alert 
              key={index} 
              severity={alert.severity} 
              sx={{ mb: 1 }}
              action={
                alert.actionable && (
                  <Button color="inherit" size="small" onClick={() => navigate(alert.actionUrl)}>
                    处理
                  </Button>
                )
              }
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="系统健康度"
            value={`${(kpis as any)?.systemHealth || 0}%`}
            icon={<Assessment />}
            color="primary"
            trend={(kpis as any)?.systemHealthTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="教学质量指数"
            value={(kpis as any)?.qualityIndex || 0}
            icon={<TrendingUp />}
            color="success"
            trend={(kpis as any)?.qualityTrend}
            suffix="/100"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="资源利用率"
            value={`${(kpis as any)?.resourceUtilization || 0}%`}
            icon={<Flag />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="满意度评分"
            value={(kpis as any)?.satisfactionScore || 0}
            icon={<Flag />}
            color="info"
            suffix="/5.0"
          />
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label="综合概览" />
          <Tab label="教学质量" />
          <Tab label="资源分析" />
          <Tab label="战略决策" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            {/* System Overview */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  系统运行概况
                </Typography>
                <Grid container spacing={2} mb={3}>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.light', color: 'white' }}>
                      <Typography variant="h4">{(stats as any)?.totalCourses || 0}</Typography>
                      <Typography variant="body2">总课程数</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'success.light', color: 'white' }}>
                      <Typography variant="h4">{(stats as any)?.totalStudents || 0}</Typography>
                      <Typography variant="body2">总学生数</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'warning.light', color: 'white' }}>
                      <Typography variant="h4">{(stats as any)?.totalProfessors || 0}</Typography>
                      <Typography variant="body2">教授总数</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Monthly Trends */}
                <Typography variant="subtitle1" gutterBottom>
                  月度趋势分析
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="courses" stackId="1" stroke="#8884d8" fill="#8884d8" name="课程数" />
                    <Area type="monotone" dataKey="students" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="学生数" />
                    <Line type="monotone" dataKey="satisfaction" stroke="#ff7300" name="满意度" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Performance Radar */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  院系绩效对比
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={departmentPerformanceData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="department" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="课程质量" dataKey="courseQuality" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="学生满意度" dataKey="studentSatisfaction" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Radar name="完成率" dataKey="completionRate" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            {/* Quick Actions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  快速决策
                </Typography>
                <List>
                  <ListItem button onClick={() => navigate('/analytics/annual-report')}>
                    <ListItemIcon>
                      <Description />
                    </ListItemIcon>
                    <ListItemText primary="生成年度报告" secondary="2025年度" />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/courses?status=pending_approval')}>
                    <ListItemIcon>
                      <Assignment />
                    </ListItemIcon>
                    <ListItemText 
                      primary="待审批事项" 
                      secondary={`${pendingApprovals?.data?.length || 0} 项待处理`}
                    />
                  </ListItem>
                  <ListItem button onClick={() => navigate('/analytics')}>
                    <ListItemIcon>
                      <Analytics />
                    </ListItemIcon>
                    <ListItemText primary="深度分析" secondary="查看详细数据" />
                  </ListItem>
                  <ListItem button>
                    <ListItemIcon>
                      <CloudDownload />
                    </ListItemIcon>
                    <ListItemText primary="导出数据" secondary="Excel/PDF" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Credit Distribution */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  学分分布
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={creditDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {creditDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  关键指标
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="平均课程容量" />
                    <Typography variant="h6">{(stats as any)?.avgCourseCapacity || 0}</Typography>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="师生比" />
                    <Typography variant="h6">1:{(stats as any)?.studentTeacherRatio || 0}</Typography>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="课程完成率" />
                    <Typography variant="h6" color="success.main">
                      {(stats as any)?.courseCompletionRate || 0}%
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="创新课程占比" />
                    <Typography variant="h6" color="primary">
                      {(stats as any)?.innovativeCourseRatio || 0}%
                    </Typography>
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
                  <Typography variant="h6">教学质量监控</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => analyticsService.exportQualityReport()}
                  >
                    导出报告
                  </Button>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>课程名称</TableCell>
                        <TableCell>教授</TableCell>
                        <TableCell>院系</TableCell>
                        <TableCell align="center">学生评分</TableCell>
                        <TableCell align="center">完成率</TableCell>
                        <TableCell align="center">创新指数</TableCell>
                        <TableCell align="center">质量等级</TableCell>
                        <TableCell align="center">操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {courseQuality?.data?.map((course: any) => (
                        <TableRow key={course._id}>
                          <TableCell>{course.nameCn}</TableCell>
                          <TableCell>{course.professor.nameCn}</TableCell>
                          <TableCell>{course.department}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={`${course.rating}/5`}
                              color={course.rating >= 4 ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">{course.completionRate}%</TableCell>
                          <TableCell align="center">{course.innovationIndex}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={course.qualityGrade}
                              color={course.qualityGrade === 'A' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small"
                              onClick={(e) => setAnchorEl(e.currentTarget)}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>查看详情</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>生成报告</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>发送反馈</MenuItem>
      </Menu>
    </Box>
  );
};

export default LeaderDashboard;