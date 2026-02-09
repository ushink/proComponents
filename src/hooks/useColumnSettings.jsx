import React, { useMemo, useState } from 'react'
import { Button, Modal, Space, Typography } from 'antd'
import { MenuOutlined, SettingOutlined } from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const { Text } = Typography

const getColumnKey = (col, index) => col.dataIndex ?? col.key ?? `col_${index}`

const loadOrder = (storageKey, columns) => {
  if (typeof window === 'undefined') return columns.map(getColumnKey)
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return columns.map(getColumnKey)
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // ignore
  }
  return columns.map(getColumnKey)
}

const saveOrder = (storageKey, order) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(order))
  } catch {
    // ignore
  }
}

const useColumnSettings = (storageKey, columns) => {
  const [order, setOrder] = useState(() => loadOrder(storageKey, columns))
  const [open, setOpen] = useState(false)

  // синхронизация с новыми/удалёнными колонками
  const onSubmit =()=>{
    const allKeys = columns.map(getColumnKey)

    setOrder((prev) => {
      const existing = prev.filter((key) => allKeys.includes(key))
      const missing = allKeys.filter((key) => !existing.includes(key))
      const next = [...existing, ...missing]
      saveOrder(storageKey, next)
      return next
    })
    setOpen(false)
  }


  const orderedColumns = useMemo(() => {
    const keyToColumn = new Map()
    columns.forEach((col, index) => {
      keyToColumn.set(getColumnKey(col, index), col)
    })
    const result = []
    order.forEach((key) => {
      const col = keyToColumn.get(key)
      if (col) result.push(col)
    })
    // на всякий случай добавим новые ключи, которые не попали в order
    columns.forEach((col, index) => {
      const key = getColumnKey(col, index)
      if (!order.includes(key)) {
        result.push(col)
      }
    })
    return result
  }, [columns, order])

  const handleDragEnd = (result) => {
    if (!result.destination) return
    const fromIndex = result.source.index
    const toIndex = result.destination.index
    if (fromIndex === toIndex) return

    setOrder((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      saveOrder(storageKey, next)
      return next
    })
  }

  const ColumnSettingsButton = () => (
    <>
      <Button icon={<SettingOutlined />} onClick={() => setOpen(true)}>
        Настроить столбцы
      </Button>
      <Modal
        title="Настройка порядка столбцов"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        okText="Готово"
        cancelText="Отмена"
        
      >
        <Text type="secondary">
          Перетаскивайте элементы, чтобы изменить порядок столбцов.
        </Text>
        <div style={{ marginTop: 16 }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="column-settings-droppable">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {orderedColumns.map((col, index) => {
                    const key = getColumnKey(col, index)
                    return (
                      <Draggable key={key} draggableId={key} index={index}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 4,
                              border: '1px solid #f0f0f0',
                              background: snapshot.isDragging ? '#e6f4ff' : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              ...dragProvided.draggableProps.style,
                            }}
                          >
                            <Space>
                              <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />
                              <span>{col.title}</span>
                            </Space>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </Modal>
    </>
  )

  return { orderedColumns, ColumnSettingsButton }
}

export default useColumnSettings

