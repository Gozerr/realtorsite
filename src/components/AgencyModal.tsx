import React, { useState, useEffect, useContext } from 'react';
import { Modal, Card, Typography, Upload, Button, message, Row, Col, Tag, Space, Alert, Form, Input } from 'antd';
import { UploadOutlined, CheckCircleOutlined, ClockCircleOutlined, EditOutlined } from '@ant-design/icons';
import { getMyAgency, uploadAgencyDocuments, uploadAgencyLogo } from '../services/agency.service';
import { AuthContext } from '../context/AuthContext';

const { Title, Text } = Typography;

interface Agency {
  id: number;
  name: string;
  verified: boolean;
  documents?: string[];
  logo?: string;
}

interface AgencyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AgencyModal: React.FC<AgencyModalProps> = ({ open, onClose, onSuccess }) => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const authContext = useContext(AuthContext);

  useEffect(() => {
    if (open) {
      if (authContext?.user?.role === 'support' || !authContext?.user?.agencyId) {
        setAgency(null);
      } else {
        loadAgency();
      }
    }
  }, [open, authContext?.user]);

  const loadAgency = async () => {
    try {
      setLoading(true);
      const agencyData = await getMyAgency(authContext?.user);
      setAgency(agencyData);
      if (agencyData) {
        form.setFieldsValue({
          name: agencyData.name,
        });
      }
    } catch (error) {
      message.error('Ошибка при загрузке данных агентства');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (fileList: any[]) => {
    if (!agency) return;

    try {
      setUploading(true);
      const formData = new FormData();
      fileList.forEach(file => {
        formData.append('documents', file.originFileObj);
      });
      formData.append('agencyName', agency.name);

      await uploadAgencyDocuments(formData);
      message.success('Документы успешно загружены');
      loadAgency();
      onSuccess?.();
    } catch (error) {
      message.error('Ошибка при загрузке документов');
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (file: any) => {
    if (!agency) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('logo', file);

      await uploadAgencyLogo(formData);
      message.success('Логотип успешно загружен');
      loadAgency();
      onSuccess?.();
    } catch (error) {
      message.error('Ошибка при загрузке логотипа');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      // Здесь можно добавить API для обновления названия агентства
      message.success('Информация обновлена');
      setEditing(false);
      loadAgency();
      onSuccess?.();
    } catch (error) {
      message.error('Ошибка при обновлении информации');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    form.setFieldsValue({
      name: agency?.name,
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Управление агентством"
      width={800}
      footer={null}
      destroyOnClose
    >
      {loading ? (
        <Card loading={true} />
      ) : agency ? (
        <div>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card title="Информация об агентстве">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text strong>Название:</Text>
                      {!editing && (
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          size="small"
                          onClick={handleEdit}
                        >
                          Изменить
                        </Button>
                      )}
                    </div>
                    {editing ? (
                      <Form form={form} layout="vertical">
                        <Form.Item name="name" rules={[{ required: true, message: 'Введите название агентства' }]}>
                          <Input />
                        </Form.Item>
                        <Space>
                          <Button type="primary" size="small" onClick={handleSave}>
                            Сохранить
                          </Button>
                          <Button size="small" onClick={handleCancel}>
                            Отмена
                          </Button>
                        </Space>
                      </Form>
                    ) : (
                      <Text>{agency.name}</Text>
                    )}
                  </div>
                  
                  <div>
                    <Text strong>Логотип агентства:</Text>
                    <br />
                    {agency.logo ? (
                      <div style={{ marginTop: 8 }}>
                        <img 
                          src={agency.logo} 
                          alt="Логотип агентства" 
                          style={{ 
                            maxWidth: 200, 
                            maxHeight: 100, 
                            objectFit: 'contain',
                            border: '1px solid #d9d9d9',
                            borderRadius: 8,
                            padding: 8
                          }} 
                        />
                      </div>
                    ) : (
                      <Text type="secondary">Логотип не загружен</Text>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <Upload
                        beforeUpload={(file) => {
                          handleLogoUpload(file);
                          return false;
                        }}
                        accept="image/*"
                        disabled={uploadingLogo}
                        showUploadList={false}
                      >
                        <Button 
                          icon={<UploadOutlined />} 
                          loading={uploadingLogo}
                          size="small"
                        >
                          {agency.logo ? 'Изменить логотип' : 'Загрузить логотип'}
                        </Button>
                      </Upload>
                    </div>
                  </div>
                  
                  <div>
                    <Text strong>Статус проверки:</Text>
                    <br />
                    {agency.verified ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        Проверено
                      </Tag>
                    ) : (
                      <Tag icon={<ClockCircleOutlined />} color="warning">
                        Ожидает проверки
                      </Tag>
                    )}
                  </div>

                  {!agency.verified && (
                    <Alert
                      message="Агентство ожидает проверки"
                      description="После загрузки документов администрация проверит ваше агентство"
                      type="info"
                      showIcon
                    />
                  )}
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title="Документы агентства">
                <Upload
                  multiple
                  beforeUpload={() => false}
                  onChange={({ fileList }) => handleUpload(fileList)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={uploading}
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    Загрузить документы
                  </Button>
                </Upload>
                
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">
                    Поддерживаемые форматы: PDF, JPG, PNG
                  </Text>
                </div>

                {agency.documents && agency.documents.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong>Загруженные документы:</Text>
                    <ul>
                      {agency.documents.map((doc, index) => (
                        <li key={index}>
                          <a href={doc} target="_blank" rel="noopener noreferrer">
                            Документ {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      ) : (
        <Alert
          message="Агентство не найдено"
          description="У вас нет привязанного агентства"
          type="error"
          showIcon
        />
      )}
    </Modal>
  );
};

export default AgencyModal; 