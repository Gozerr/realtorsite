import React from 'react';
import { Form, Input, Button, InputNumber, Select, Checkbox } from 'antd';
import { CreatePropertyData, PropertyStatus } from '../types';

interface CreatePropertyFormProps {
  onSubmit: (data: CreatePropertyData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const CreatePropertyForm: React.FC<CreatePropertyFormProps> = ({ onSubmit, onCancel, loading }) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{ status: PropertyStatus.FOR_SALE, isExclusive: false }}
      requiredMark={false}
    >
      <Form.Item
        name="title"
        label="Название"
        rules={[{ required: true, message: 'Введите название' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="address"
        label="Адрес"
        rules={[{ required: true, message: 'Введите адрес' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Описание"
        rules={[{ required: true, message: 'Введите описание' }]}
      >
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item
        name="price"
        label="Цена"
        rules={[{ required: true, type: 'number', message: 'Введите цену' }]}
      >
        <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} />
      </Form.Item>
      <Form.Item
        name="status"
        label="Статус"
        rules={[{ required: true, message: 'Выберите статус' }]}
      >
        <Select>
          <Select.Option value={PropertyStatus.FOR_SALE}>В продаже</Select.Option>
          <Select.Option value={PropertyStatus.IN_DEAL}>В сделке</Select.Option>
          <Select.Option value={PropertyStatus.SOLD}>Продано</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="isExclusive" valuePropName="checked">
        <Checkbox>Эксклюзивный объект</Checkbox>
      </Form.Item>
      <div style={{ marginTop: 16 }}>
        <Button onClick={onCancel} style={{ marginRight: 8 }} disabled={loading}>
          Отмена
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Сохранить объект
        </Button>
      </div>
    </Form>
  );
};

export default CreatePropertyForm; 