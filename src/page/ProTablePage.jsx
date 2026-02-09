import React, { useEffect, useState } from 'react'
import { Flex, Typography, Input, Button, Space } from 'antd'
import { EditableProTable } from '@ant-design/pro-components'
import useColumnSettings from '../hooks/useColumnSettings'

const { Title } = Typography

const STORAGE_KEY = 'pro-table-page-state'

const baseColumns = [
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

const initialDataSource = [
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
  const [columns, setColumns] = useState(() => {
    if (typeof window === 'undefined') return baseColumns
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (!saved) return baseColumns
      const parsed = JSON.parse(saved)
      if (parsed?.columns && Array.isArray(parsed.columns)) {
        return parsed.columns
      }
    } catch {
      // ignore
    }
    return baseColumns
  })

  const [dataSource, setDataSource] = useState(() => {
    if (typeof window === 'undefined') return initialDataSource
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (!saved) return initialDataSource
      const parsed = JSON.parse(saved)
      if (parsed?.dataSource && Array.isArray(parsed.dataSource)) {
        return parsed.dataSource
      }
    } catch {
      // ignore
    }
    return initialDataSource
  })

  const [customColumnIndex, setCustomColumnIndex] = useState(() => {
    if (typeof window === 'undefined') return 1
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (!saved) return 1
      const parsed = JSON.parse(saved)
      if (typeof parsed?.customColumnIndex === 'number') {
        return parsed.customColumnIndex
      }
    } catch {
      // ignore
    }
    return 1
  })

  const [editableKeys, setEditableKeys] = useState(() => {
    if (typeof window === 'undefined') return initialDataSource.map((r) => r.key)
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (!saved) return initialDataSource.map((r) => r.key)
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed?.editableKeys)) {
        return parsed.editableKeys
      }
      if (Array.isArray(parsed?.dataSource)) {
        return parsed.dataSource.map((r) => r.key)
      }
    } catch {
      // ignore
    }
    return initialDataSource.map((r) => r.key)
  })

  const [newColumnName, setNewColumnName] = useState('')
  const [draggingColumnKey, setDraggingColumnKey] = useState(null)

  const { orderedColumns, ColumnSettingsButton } = useColumnSettings(
    'pro-table-page-columns-order',
    columns,
  )

  // сохранение состояния в localStorage
  useEffect(() => {
    const payload = {
      columns,
      dataSource,
      customColumnIndex,
      editableKeys,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [columns, dataSource, customColumnIndex, editableKeys])

  const handleAddColumn = () => {
    const trimmedName = newColumnName.trim()
    if (!trimmedName) return

    const dataIndex = `custom_${customColumnIndex}`

    setColumns((prev) => [
      ...prev,
      {
        title: trimmedName,
        dataIndex,
      },
    ])

    setDataSource((prev) =>
      prev.map((row) => ({
        ...row,
        [dataIndex]: '',
      })),
    )

    setCustomColumnIndex((i) => i + 1)
    setNewColumnName('')
  }

  const handleDragStart = (dataIndex) => {
    setDraggingColumnKey(dataIndex)
  }

  const handleDrop = (targetDataIndex) => {
    if (!draggingColumnKey || draggingColumnKey === targetDataIndex) return

    setColumns((prev) => {
      const fromIndex = prev.findIndex((c) => c.dataIndex === draggingColumnKey)
      const toIndex = prev.findIndex((c) => c.dataIndex === targetDataIndex)
      if (fromIndex === -1 || toIndex === -1) return prev

      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })

    setDraggingColumnKey(null)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const draggableColumns = orderedColumns.map((col) => ({
    ...col,
    onHeaderCell: () => ({
      draggable: true,
      onDragStart: () => handleDragStart(col.dataIndex),
      onDragOver: handleDragOver,
      onDrop: () => handleDrop(col.dataIndex),
    }),
  }))

  return (
    <Flex vertical style={{ padding: 24, minHeight: '100vh', gap: 16 }}>
      <Title level={3}>ProTable (ant-design/pro-components)</Title>

      <Space style={{ marginBottom: 8 }} wrap>
        <Input
          placeholder="Название нового столбца"
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          onPressEnter={handleAddColumn}
          style={{ maxWidth: 320 }}
        />
        <Button type="primary" onClick={handleAddColumn}>
          Добавить столбец
        </Button>
        <ColumnSettingsButton />
      </Space>

      <EditableProTable
        rowKey="key"
        columns={draggableColumns}
        value={dataSource}
        onChange={setDataSource}
        editable={{
          type: 'multiple',
          editableKeys,
          onChange: setEditableKeys,
          onValuesChange: (_, recordList) => {
            setDataSource(recordList)
          },
        }}
        search={false}
        options={false}
        pagination={false}
      />
    </Flex>
  )
}

export default ProTablePage

