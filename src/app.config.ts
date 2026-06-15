export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/members/index',
    'pages/reminders/index',
    'pages/checkin/index',
    'pages/records/index',
    'pages/medicine-add/index',
    'pages/medicine-detail/index',
    'pages/member-add/index',
    'pages/prescription/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#10B981',
    navigationBarTitleText: '家庭药品提醒',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F0FDF4'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#10B981',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '药箱首页'
      },
      {
        pagePath: 'pages/members/index',
        text: '成员用药'
      },
      {
        pagePath: 'pages/checkin/index',
        text: '服药打卡'
      },
      {
        pagePath: 'pages/reminders/index',
        text: '到期提醒'
      },
      {
        pagePath: 'pages/records/index',
        text: '记录查询'
      }
    ]
  }
})
