import React from 'react'
import { Table, Typography, Flex } from 'antd'

const { Title } = Typography

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: 'Имя',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Возраст',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: 'Город',
    dataIndex: 'city',
    key: 'city',
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

const TablePage = () => {
  return (
    <Flex vertical style={{ padding: 24, minHeight: '100vh' }}>
      <Title level={3}>Обычная таблица (Antd Table)</Title>
      <Table columns={columns} dataSource={dataSource} pagination={false} />
    </Flex>
  )
}

export default TablePage

