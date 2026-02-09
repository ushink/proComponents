import React from 'react'
import { Button, Flex, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

const Dashboard = () => {
  const navigate = useNavigate()

  return (
    <Flex
      vertical
      align="center"
      justify="center"
      style={{ minHeight: '100vh', gap: 32 }}
    >
      <Title level={2} style={{ margin: 0 }}>
        Dashboard
      </Title>
      <Text type="secondary">Выберите тип таблицы, которую хотите посмотреть</Text>

      <Flex gap={24} wrap="wrap" justify="center">
        <Button
          type="primary"
          size="large"
          style={{ paddingInline: 40, paddingBlock: 20, fontSize: 18 }}
          onClick={() => navigate('/table')}
        >
          Обычная таблица (Antd Table)
        </Button>

        <Button
          type="default"
          size="large"
          style={{ paddingInline: 40, paddingBlock: 20, fontSize: 18 }}
          onClick={() => navigate('/pro-table')}
        >
          ProTable (ant-design/pro-components)
        </Button>
      </Flex>
    </Flex>
  )
}

export default Dashboard

