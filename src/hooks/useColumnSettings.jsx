import React, { useMemo, useState, useCallback } from 'react'
import { Button, Modal, Space, Typography, Checkbox } from 'antd'
import { MenuOutlined, SettingOutlined } from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const { Text } = Typography

const getColumnKey = (col, index) => col.dataIndex ?? col.key ?? `col_${index}`

const useColumnSettings = (storageKey, columns) => {
  // Получаем все ключи текущих колонок
  const allColumnKeys = useMemo(() => 
    columns.map((col, i) => getColumnKey(col, i)), 
    [columns]
  )

  // Настройки загружаются один раз, но мы их обновляем при каждом рендере
  const [baseSettings, setBaseSettings] = useState(() => {
    if (typeof window === 'undefined') {
      return { order: [], hidden: [] }
    }
    
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (!saved) return { order: [], hidden: [] }
      
      const parsed = JSON.parse(saved)
      return { 
        order: Array.isArray(parsed?.order) ? parsed.order : [], 
        hidden: Array.isArray(parsed?.hidden) ? parsed.hidden : [] 
      }
    } catch {
      return { order: [], hidden: [] }
    }
  })

  // Деривированные настройки, которые всегда синхронизированы с текущими колонками
  const settings = useMemo(() => {
    // Фильтруем только существующие ключи
    const validOrder = baseSettings.order.filter(key => allColumnKeys.includes(key))
    const validHidden = baseSettings.hidden.filter(key => allColumnKeys.includes(key))
    
    // Добавляем новые колонки в конец order
    const newKeys = allColumnKeys.filter(key => !validOrder.includes(key))
    const order = [...validOrder, ...newKeys]
    
    return { order, hidden: validHidden }
  }, [baseSettings.order, baseSettings.hidden, allColumnKeys])

  const [open, setOpen] = useState(false)

  // Сохраняем настройки
  const saveSettings = useCallback((newOrder, newHidden) => {
    // Фильтруем только существующие ключи
    const validOrder = newOrder.filter(key => allColumnKeys.includes(key))
    const validHidden = newHidden.filter(key => allColumnKeys.includes(key))
    
    setBaseSettings({ order: validOrder, hidden: validHidden })
    if (typeof window !== 'undefined') {
      try {
        const payload = { order: validOrder, hidden: validHidden }
        window.localStorage.setItem(storageKey, JSON.stringify(payload))
      } catch {
        // ignore
      }
    }
  }, [allColumnKeys, storageKey])

  // Компонент модального окна
  const ColumnSettingsModal = () => {
    // В модалке всегда показываем ВСЕ текущие колонки
    const [localOrder, setLocalOrder] = useState(settings.order)
    const [localHidden, setLocalHidden] = useState(settings.hidden)

    // Сбрасываем состояние при открытии
    const handleAfterOpenChange = useCallback((visible) => {
      if (visible) {
        setLocalOrder(settings.order)
        setLocalHidden(settings.hidden)
      }
    }, [settings.order, settings.hidden])

    const handleDragEnd = useCallback((result) => {
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
    }, [])

    const handleToggleVisibility = useCallback((key, checked) => {
      setLocalHidden((prev) =>
        checked ? prev.filter((h) => h !== key) : [...prev, key]
      )
    }, [])

    const handleSubmit = useCallback(() => {
      saveSettings(localOrder, localHidden)
      setOpen(false)
    }, [localOrder, localHidden, saveSettings])

    const handleCancel = useCallback(() => {
      setOpen(false)
    }, [])

    // Создаем мап колонок
    const columnMap = useMemo(() => {
      const map = new Map()
      columns.forEach((col, i) => {
        map.set(getColumnKey(col, i), col)
      })
      return map
    }, [columns])

    // Всегда показываем все колонки
    const visibleItems = localOrder.map(key => ({
      key,
      column: columnMap.get(key)
    })).filter(item => item.column)

    if (!open) return null

    return (
      <Modal
        title="Настройка порядка столбцов"
        open={open}
        onCancel={handleCancel}
        onOk={handleSubmit}
        afterOpenChange={handleAfterOpenChange}
        okText="Готово"
        cancelText="Отмена"
        maskClosable={false}
        width={500}
      >
        <Text type="secondary">
          Перетаскивайте элементы, чтобы изменить порядок столбцов. Отмечайте чекбоксы для скрытия/показа.
        </Text>
        <div style={{ marginTop: 16, maxHeight: 400, overflowY: 'auto' }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="column-settings-droppable">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {visibleItems.map(({ key, column }, index) => (
                    <Draggable key={key} draggableId={key} index={index}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
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
                            <div {...dragProvided.dragHandleProps} style={{ cursor: 'grab' }}>
                              <MenuOutlined style={{ color: '#999' }} />
                            </div>
                            <Checkbox
                              checked={!localHidden.includes(key)}
                              onChange={(e) => handleToggleVisibility(key, e.target.checked)}
                              style={{ minWidth: 200 }}
                            >
                              {column.title}
                            </Checkbox>
                          </Space>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </Modal>
    )
  }

  // Отфильтрованные и отсортированные колонки для таблицы
  const orderedColumns = useMemo(() => {
    const columnMap = new Map()
    columns.forEach((col, index) => {
      columnMap.set(getColumnKey(col, index), col)
    })
    
    return settings.order
      .filter(key => !settings.hidden.includes(key) && columnMap.has(key))
      .map(key => columnMap.get(key))
  }, [columns, settings.order, settings.hidden])

  const ColumnSettingsButton = () => (
    <>
      <Button icon={<SettingOutlined />} onClick={() => setOpen(true)}>
        Настроить столбцы
      </Button>
      <ColumnSettingsModal />
    </>
  )

  return { orderedColumns, ColumnSettingsButton }
}

export default useColumnSettings