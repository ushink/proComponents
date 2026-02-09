import React, { useMemo, useState, useCallback, useEffect } from 'react'
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
  const [draftOrder, setDraftOrder] = useState([])

  // Инициализируем draftOrder при монтировании
  useEffect(() => {
    setDraftOrder(order)
  }, [order])

  // Обработчик открытия модалки - используем useCallback
  const handleOpenModal = useCallback(() => {
    setOpen(true)
    // Устанавливаем draftOrder синхронно при открытии
    setDraftOrder(order)
    console.log('draftOrder', draftOrder)
  }, [order])


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

  // Компонент модального окна
  const ColumnSettingsModal = () => {
    // Используем локальное состояние для отображения в модалке
    const [localOrder, setLocalOrder] = useState(order)
    
    // Синхронизируем при открытии с использованием requestAnimationFrame
    useEffect(() => {
      if (open) {
        // Используем requestAnimationFrame для избежания синхронного обновления
        const timer = requestAnimationFrame(() => {
          setLocalOrder(order)
        })
        return () => cancelAnimationFrame(timer)
      }
    }, [open, order])

    if (!open) return null

    const handleModalDragEnd = (result) => {
      if (!result.destination) return
      const fromIndex = result.source.index
      const toIndex = result.destination.index
      if (fromIndex === toIndex) return

      setLocalOrder((prev) => {
        const next = [...prev]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return next
      })
    }

    const handleModalSubmit = () => {
      const allKeys = columns.map(getColumnKey)
      const existing = localOrder.filter((key) => allKeys.includes(key))
      const missing = allKeys.filter((key) => !existing.includes(key))
      const next = [...existing, ...missing]
      
      setOrder(next)
      saveOrder(storageKey, next)
      setOpen(false)
    }

    return (
      <Modal
        title="Настройка порядка столбцов"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleModalSubmit}
        okText="Готово"
        cancelText="Отмена"
        destroyOnClose={false}
        maskClosable={false}
      >
        <Text type="secondary">
          Перетаскивайте элементы, чтобы изменить порядок столбцов.
        </Text>
        <div style={{ marginTop: 16 }}>
          <DragDropContext onDragEnd={handleModalDragEnd}>
            <Droppable droppableId="column-settings-droppable">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {localOrder.map((key, index) => {
                    const col = columns.find((c, i) => getColumnKey(c, i) === key)
                    if (!col) return null
                    
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
    )
  }

  const ColumnSettingsButton = () => (
    <>
      <Button icon={<SettingOutlined />} onClick={handleOpenModal}>
        Настроить столбцы
      </Button>
      <ColumnSettingsModal />
    </>
  )

  return { orderedColumns, ColumnSettingsButton }
}

export default useColumnSettings