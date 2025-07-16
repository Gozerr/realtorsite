import React, { useEffect, useState } from 'react';
import { Modal, Select, Input, Button, message } from 'antd';
import { fetchSelections, createSelection, addPropertyToSelection, Selection } from '../services/selection.service';

interface AddToSelectionModalProps {
  open: boolean;
  propertyId?: number;
  onClose: () => void;
  createOnly?: boolean;
}

const AddToSelectionModal: React.FC<AddToSelectionModalProps> = ({ open, propertyId, onClose, createOnly }) => {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);

  // Получаем токен пользователя
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (open) {
      fetchSelections().then(setSelections);
      setSelectedId(undefined);
      setNewTitle('');
    }
  }, [open]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const newSel = await createSelection(newTitle.trim(), token || undefined);
      setSelections(prev => [...prev, newSel]);
      setSelectedId(newSel.id);
      setNewTitle('');
      message.success('Подборка создана');
      if (createOnly) onClose();
    } finally {
      setCreating(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedId || !propertyId) return;
    setAdding(true);
    try {
      await addPropertyToSelection(selectedId, propertyId);
      message.success('Объект добавлен в подборку');
      onClose();
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} title={createOnly ? 'Создать подборку' : 'Добавить в подборку'} destroyOnHidden>
      <div onClick={e => e.stopPropagation()}>
        {!createOnly && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>Выберите подборку</div>
            <Select
              style={{ width: '100%' }}
              placeholder="Выберите подборку"
              value={selectedId}
              onChange={setSelectedId}
              options={selections.map(s => ({ label: s.title, value: s.id }))}
              allowClear
            />
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>Или создайте новую</div>
          <Input
            placeholder="Название подборки"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={{ width: 'calc(100% - 110px)', marginRight: 8 }}
            onPressEnter={handleCreate}
          />
          <Button type="primary" onClick={handleCreate} disabled={!newTitle.trim()} loading={creating}>
            Создать
          </Button>
        </div>
        {!createOnly && (
          <Button type="primary" block disabled={!selectedId} onClick={e => { e.stopPropagation(); handleAdd(); }} loading={adding}>
            Добавить
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default AddToSelectionModal; 