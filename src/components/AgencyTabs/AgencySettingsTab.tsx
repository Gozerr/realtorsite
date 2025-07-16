import React, { useEffect, useState, useRef } from 'react';
import { Card, Typography, Tag, Upload, Button, message, Spin, List, Image, Form, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { getMyAgency, uploadAgencyLogo, uploadAgencyDocuments } from '../../services/agency.service';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

const AgencySettingsTab: React.FC<{ agency?: any }> = () => {
  const { user } = useAuth();
  const [agency, setAgency] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

  const loadAgency = async () => {
    setLoading(true);
    try {
      const data = await getMyAgency(user);
      setAgency(data);
    } catch {
      message.error('Не удалось загрузить агентство');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAgency(); /* eslint-disable-next-line */ }, []);

  const handleLogoChange = async (info: any) => {
    if (info.file.status === 'uploading') {
      setLogoLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      message.success('Логотип успешно загружен');
      loadAgency();
      setLogoLoading(false);
    } else if (info.file.status === 'error') {
      message.error('Ошибка при загрузке логотипа');
      setLogoLoading(false);
    }
  };

  const customLogoRequest = async ({ file, onSuccess, onError }: any) => {
    const formData = new FormData();
    formData.append('logo', file);
    try {
      await uploadAgencyLogo(formData);
      onSuccess('ok');
    } catch (e) {
      onError(e);
    }
  };

  const handleDocsChange = async (info: any) => {
    if (info.file.status === 'uploading') {
      setDocsLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      message.success('Документы успешно загружены');
      loadAgency();
      setDocsLoading(false);
    } else if (info.file.status === 'error') {
      message.error('Ошибка при загрузке документов');
      setDocsLoading(false);
    }
  };

  const customDocsRequest = async ({ file, onSuccess, onError }: any) => {
    const formData = new FormData();
    formData.append('documents', file);
    try {
      await uploadAgencyDocuments(formData);
      onSuccess('ok');
    } catch (e) {
      onError(e);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    form.setFieldsValue({
      name: agency.name,
      address: agency.address,
      phone: agency.phone,
      email: agency.email,
      description: agency.description,
      website: agency.website,
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await fetch('/api/agencies/my-agency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
        credentials: 'include',
      });
      message.success('Информация об агентстве обновлена');
      setEditing(false);
      loadAgency();
    } catch (e) {
      message.error('Ошибка при обновлении информации');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    form.setFieldsValue({
      name: agency.name,
      address: agency.address,
      phone: agency.phone,
      email: agency.email,
      description: agency.description,
      website: agency.website,
    });
  };

  if (loading) return <Spin />;
  if (!agency) return <div>Агентство не найдено</div>;

  return (
    <Card style={{ maxWidth: 600 }}>
      <Title level={4}>Настройки агентства</Title>
      {editing ? (
        <Form form={form} layout="vertical">
          <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название агентства' }]}> <Input /> </Form.Item>
          <Form.Item label="Адрес" name="address"> <Input /> </Form.Item>
          <Form.Item label="Телефон" name="phone"> <Input /> </Form.Item>
          <Form.Item label="Email" name="email"> <Input /> </Form.Item>
          <Form.Item label="Описание" name="description"> <Input.TextArea rows={3} /> </Form.Item>
          <Form.Item label="Сайт" name="website"> <Input /> </Form.Item>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" onClick={handleSave}>Сохранить</Button>
            <Button onClick={handleCancel}>Отмена</Button>
          </div>
        </Form>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Название:</Text> {agency.name}
            {user?.role === 'director' && (
              <Button type="link" size="small" onClick={handleEdit} style={{ marginLeft: 8 }}>Редактировать</Button>
            )}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Статус:</Text> {agency.verified ? <Tag color="green">Верифицировано</Tag> : <Tag color="orange">Не верифицировано</Tag>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Логотип:</Text><br />
            {agency.logo ? <Image src={agency.logo} width={120} alt="Логотип" /> : <Text type="secondary">Нет логотипа</Text>}
            {user?.role === 'director' && (
              <Upload
                name="logo"
                showUploadList={false}
                customRequest={customLogoRequest}
                onChange={handleLogoChange}
                accept="image/*"
                disabled={logoLoading}
              >
                <Button icon={<UploadOutlined />} loading={logoLoading} style={{ marginTop: 8 }}>Загрузить логотип</Button>
              </Upload>
            )}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Документы:</Text>
            {agency.documents && agency.documents.length > 0 ? (
              <List
                size="small"
                dataSource={agency.documents}
                renderItem={doc => {
                  const docStr = String(doc);
                  return (
                    <List.Item>
                      <a href={docStr} target="_blank" rel="noopener noreferrer">{docStr.split('/').pop()}</a>
                    </List.Item>
                  );
                }}
              />
            ) : <Text type="secondary">Нет документов</Text>}
            {user?.role === 'director' && (
              <Upload
                name="documents"
                showUploadList={false}
                customRequest={customDocsRequest}
                onChange={handleDocsChange}
                accept=".pdf,image/*"
                disabled={docsLoading}
              >
                <Button icon={<UploadOutlined />} loading={docsLoading} style={{ marginTop: 8 }}>Загрузить документ</Button>
              </Upload>
            )}
          </div>
        </>
      )}
    </Card>
  );
};

export default AgencySettingsTab; 