import React, { useState, useEffect, useContext } from 'react';
import { Card, Typography, Upload, Button, message, Row, Col, Tag, Space, Alert } from 'antd';
import { UploadOutlined, CheckCircleOutlined, ClockCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { getMyAgency, uploadAgencyDocuments, uploadAgencyLogo } from '../services/agency.service';
import AgencyModal from '../components/AgencyModal';

const { Title, Text } = Typography;

interface Agency {
  id: number;
  name: string;
  verified: boolean;
  documents?: string[];
  logo?: string; // Путь к логотипу агентства
}

const AgencyPage: React.FC = () => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);
  const authContext = useContext(AuthContext);

  useEffect(() => {
    if (authContext?.user) {
      if (authContext.user.role === 'support' || !authContext.user.agencyId) {
        setAgency(null);
      } else {
        loadAgency();
      }
    }
  }, [authContext?.user]);

  const loadAgency = async () => {
    try {
      setLoading(true);
      const agencyData = await getMyAgency(authContext?.user);
      setAgency(agencyData);
      if (agencyData) {
        // ... existing code ...
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
      loadAgency(); // Перезагружаем данные
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
      loadAgency(); // Перезагружаем данные
    } catch (error) {
      message.error('Ошибка при загрузке логотипа');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (!authContext?.user) {
    return <div>Необходимо войти в систему</div>;
  }

  if (authContext.user.role !== 'director') {
    return (
      <Alert
        message="Доступ запрещён"
        description="Эта страница доступна только директорам агентств"
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Моё агентство</Title>
        <Button 
          type="primary" 
          icon={<SettingOutlined />}
          onClick={() => setAgencyModalOpen(true)}
        >
          Управление агентством
        </Button>
      </div>
      
      {loading ? (
        <Card loading={true} />
      ) : agency ? (
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Card title="Информация об агентстве">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong>Название:</Text>
                  <br />
                  <Text>{agency.name}</Text>
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
      ) : (
        <Alert
          message="Агентство не найдено"
          description="У вас нет привязанного агентства"
          type="error"
          showIcon
        />
      )}

      <AgencyModal 
        open={agencyModalOpen}
        onClose={() => setAgencyModalOpen(false)}
        onSuccess={() => {
          loadAgency();
          setAgencyModalOpen(false);
        }}
      />
    </div>
  );
};

export default AgencyPage; 