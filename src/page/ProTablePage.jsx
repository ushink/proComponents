import React from 'react'
import { Flex, Typography } from 'antd'
import { ProTable } from '@ant-design/pro-components'

const { Title } = Typography

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
  },
  {
    title: 'Имя',
    dataIndex: 'name',
  },
  {
    title: 'Возраст',
    dataIndex: 'age',
    valueType: 'digit',
  },
  {
    title: 'Город',
    dataIndex: 'city',
  },
]

const dataSource = [
  {
    key: 1,
    id: 1,
    name: 'Иван',
    age: 28,
    city: 'Москва',
  },
  {
    key: 2,
    id: 2,
    name: 'Анна',
    age: 24,
    city: 'Санкт-Петербург',
  },
  {
    key: 3,
    id: 3,
    name: 'Петр',
    age: 32,
    city: 'Казань',
  },
]

const ProTablePage = () => {
  return (
    <Flex vertical style={{ padding: 24, minHeight: '100vh' }}>
      <Title level={3}>ProTable (ant-design/pro-components)</Title>
      <ProTable
        rowKey="key"
        columns={columns}
        dataSource={dataSource}
        search={false}
        options={false}
        pagination={false}
      />
    </Flex>
  )
}

export default ProTablePage

