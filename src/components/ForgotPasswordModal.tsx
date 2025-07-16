import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { forgotPassword, resetPassword } from '../services/auth.service';

const { Text } = Typography;

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');

  const handleEmailSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await forgotPassword(values.email);
      setEmail(values.email);
      setStep('reset');
      message.success('Инструкции отправлены на ваш email');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Ошибка при отправке запроса';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (values: { token: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(values.token, values.newPassword);
      message.success('Пароль успешно изменен');
      onClose();
      form.resetFields();
      setStep('email');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Ошибка при сбросе пароля';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    form.resetFields();
    setStep('email');
  };

  return (
    <Modal
      title={
        step === 'email' 
          ? 'Восстановление пароля' 
          : 'Введите новый пароль'
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={400}
    >
      {step === 'email' ? (
        <Form
          form={form}
          onFinish={handleEmailSubmit}
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Введите ваш email"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Отправить инструкции
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              На ваш email будет отправлена ссылка для восстановления пароля
            </Text>
          </div>
        </Form>
      ) : (
        <Form
          form={form}
          onFinish={handleResetSubmit}
          layout="vertical"
        >
          <Form.Item
            name="token"
            label="Код восстановления"
            rules={[
              { required: true, message: 'Введите код из письма' },
            ]}
          >
            <Input
              placeholder="Введите код из письма"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Новый пароль"
            rules={[
              { required: true, message: 'Введите новый пароль' },
              { min: 8, message: 'Пароль должен быть не менее 8 символов' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/,
                message: 'Пароль должен содержать буквы, цифры и спецсимволы',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Введите новый пароль"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Подтвердите пароль"
            rules={[
              { required: true, message: 'Подтвердите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Пароли не совпадают'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Подтвердите новый пароль"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Изменить пароль
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              Код отправлен на {email}
            </Text>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal; 