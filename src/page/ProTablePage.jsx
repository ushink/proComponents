import React, { useEffect, useState } from 'react'
import { Flex, Typography, Input, Button, Space } from 'antd'
import { EditableProTable } from '@ant-design/pro-components'
import { Resizable } from 'react-resizable'
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

const DEFAULT_WIDTH = 120
const MIN_WIDTH = 50
const MAX_WIDTH = 500

const ResizableHeader = (props) => {
  const { onResize, width, ...restProps } = props

  if (width === undefined) {
    return <th {...restProps} />
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            width: '3px',
            right: '-1px',
            top: 0,
            bottom: 0,
            background: '#f0f0f0',
            cursor: 'col-resize',
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
      minConstraints={[MIN_WIDTH, 0]}
      maxConstraints={[MAX_WIDTH, 0]}
    >
      <th {...restProps} />
    </Resizable>
  )
}

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

  const [columnWidths, setColumnWidths] = useState(() => {
    if (typeof window === 'undefined') return {}
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        return baseColumns.reduce((acc, col) => {
          acc[col.dataIndex] = DEFAULT_WIDTH
          return acc
        }, {})
      }
      const parsed = JSON.parse(saved)
      if (parsed?.columnWidths && typeof parsed.columnWidths === 'object') {
        return parsed.columnWidths
      }
    } catch {
      // ignore
    }
    return baseColumns.reduce((acc, col) => {
      acc[col.dataIndex] = DEFAULT_WIDTH
      return acc
    }, {})
  })

  const [newColumnName, setNewColumnName] = useState('')

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
      columnWidths,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [columns, dataSource, customColumnIndex, editableKeys, columnWidths])

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

    // Добавляем дефолтную ширину для новой колонки
    setColumnWidths((prev) => ({
      ...prev,
      [dataIndex]: DEFAULT_WIDTH,
    }))

    setCustomColumnIndex((i) => i + 1)
    setNewColumnName('')
  }

  const resizableColumns = orderedColumns.map((col) => ({
    ...col,
    width: columnWidths[col.dataIndex],
    onHeaderCell: () => ({
      width: columnWidths[col.dataIndex],
      onResize: (e, { size }) => {
        setColumnWidths((prev) => ({
          ...prev,
          [col.dataIndex]: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, size.width)),
        }))
      },
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
        components={{
          header: {
            cell: ResizableHeader,
          },
        }}
        rowKey="key"
        columns={resizableColumns}
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