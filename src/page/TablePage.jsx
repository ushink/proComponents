import React, { useEffect, useState } from 'react'
import { Table, Typography, Flex, Input, Button, Space } from 'antd'
import { Resizable } from 'react-resizable'
import useColumnSettings from '../hooks/useColumnSettings'

const { Title } = Typography

const STORAGE_KEY = 'table-page-state'

const baseColumns = [
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
            width: '10px',  // Увеличенная область захвата
            right: '-5px',  // Центрирование на границе столбца
            top: 0,
            bottom: 0,
            background: 'transparent',  // Прозрачный фон для незаметности
            cursor: 'col-resize',
            transition: 'background 0.2s',  // Для hover-эффекта
          }}
          onMouseEnter={(e) => { e.target.style.background = '#f0f0f0'; }}  // Визуальная индикация при hover
          onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
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

const TablePage = () => {
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
    'table-page-columns-order',
    columns,
  )

  // сохранение в localStorage при любых изменениях
  useEffect(() => {
    const payload = {
      columns,
      dataSource,
      customColumnIndex,
      columnWidths,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [columns, dataSource, customColumnIndex, columnWidths])

  const handleCellChange = (rowKey, dataIndex, value) => {
    setDataSource((prev) =>
      prev.map((row) =>
        row.key === rowKey
          ? {
              ...row,
              [dataIndex]: value,
            }
          : row,
      ),
    )
  }

  const handleAddColumn = () => {
    const trimmedName = newColumnName.trim()
    if (!trimmedName) return

    const dataIndex = `custom_${customColumnIndex}`

    // Добавляем новую колонку
    setColumns((prev) => [
      ...prev,
      {
        title: trimmedName,
        dataIndex,
        key: dataIndex,
      },
    ])

    // Обновляем данные: добавляем новое поле в каждую строку
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

  const editableColumns = orderedColumns.map((col) => ({
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
    render: (_, record) => (
      <Input
        value={record[col.dataIndex] ?? ''}
        onChange={(e) => handleCellChange(record.key, col.dataIndex, e.target.value)}
      />
    ),
  }))

  return (
    <Flex vertical style={{ padding: 24, minHeight: '100vh', gap: 16 }}>
      <Title level={3}>Обычная таблица (Antd Table)</Title>

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

      <Table
        components={{
          header: {
            cell: ResizableHeader,
          },
        }}
        columns={editableColumns}
        dataSource={dataSource}
        pagination={false}
      />
    </Flex>
  )
}

export default TablePage