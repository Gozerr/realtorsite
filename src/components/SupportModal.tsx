import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography } from 'antd';
import { PhoneOutlined, UserOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { createSupportRequest } from '../services/support.service';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await createSupportRequest(values);
      message.success('Ваш запрос отправлен в службу поддержки. Мы свяжемся с вами в ближайшее время.');
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Error creating support request:', error);
      message.error('Ошибка при отправке запроса. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <Title level={3} style={{ margin: 0 }}>
            <QuestionCircleOutlined style={{ marginRight: 8 }} />
            Служба поддержки
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
      <div style={{ marginBottom: 24 }}>
        <Text type="secondary">
          Опишите вашу проблему, и наш специалист свяжется с вами по указанному номеру телефона
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item
            name="lastName"
            label="Фамилия"
            rules={[{ required: true, message: 'Пожалуйста, введите фамилию' }]}
            style={{ flex: 1 }}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Фамилия"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="firstName"
            label="Имя"
            rules={[{ required: true, message: 'Пожалуйста, введите имя' }]}
            style={{ flex: 1 }}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Имя"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="middleName"
            label="Отчество"
            rules={[{ required: true, message: 'Пожалуйста, введите отчество' }]}
            style={{ flex: 1 }}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Отчество"
              size="large"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="phone"
          label="Номер телефона"
          rules={[
            { required: true, message: 'Пожалуйста, введите номер телефона' },
            { pattern: /^\+?[0-9\s\-\(\)]+$/, message: 'Введите корректный номер телефона' }
          ]}
        >
          <Input 
            prefix={<PhoneOutlined />} 
            placeholder="+7 (999) 123-45-67"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="problem"
          label="Опишите вашу проблему"
          rules={[{ required: true, message: 'Пожалуйста, опишите вашу проблему' }]}
        >
          <TextArea
            rows={6}
            placeholder="Подробно опишите проблему, с которой вы столкнулись при работе с площадкой..."
            size="large"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            style={{ 
              width: 200,
              height: 48,
              fontSize: 16,
              fontWeight: 500
            }}
          >
            Отправить запрос
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SupportModal; 