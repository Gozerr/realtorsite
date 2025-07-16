import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Typography, Space, Spin, Empty, Modal, List, message, Tooltip } from 'antd';
import { FolderOpenOutlined, ClockCircleOutlined, LikeOutlined, DislikeOutlined, LinkOutlined, FilePdfOutlined, QuestionCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchSelections, Selection, getSelectionById, getClientLikes, getClientLink, downloadSelectionPdf, removePropertyFromSelection, deleteSelection } from '../services/selection.service';
import AddToSelectionModal from '../components/AddToSelectionModal';
import { Property } from '../types';
import { getAllProperties } from '../services/property.service';
import OptimizedImage from '../components/OptimizedImage';

const { Title } = Typography;

interface SelectionCardProps {
  sel: any;
  onView: (sel: any) => void;
  onDelete: (sel: any) => void;
}

const getPhotoUrl = (photo?: string) => {
  if (!photo) return '/placeholder-property.jpg';
  if (photo.startsWith('/uploads/')) {
    return 'http://localhost:3001' + photo;
  }
  return photo;
};

const SelectionCard: React.FC<SelectionCardProps> = ({ sel, onView, onDelete }) => {
  // Берём первые 3-4 фото из объектов подборки
  const photos: string[] = (sel.properties || [])
    .flatMap((p: any) => p.photos && p.photos.length > 0 ? [p.photos[0]] : [])
    .slice(0, 4);

  return (
    <div className="wow-selection-card" onClick={() => onView(sel)}>
      <div className="wow-selection-collage">
        {photos.length === 0 ? (
          <img src="/placeholder-property.jpg" alt="placeholder" className="collage-img single" />
        ) : (
          photos.map((photo, idx) => (
            <img
              key={idx}
              src={getPhotoUrl(photo)}
              alt={`Объект ${idx + 1}`}
              className={`collage-img collage-img-${idx}`}
              style={{ zIndex: 4 - idx }}
            />
          ))
        )}
      </div>
      <div className="wow-selection-content">
        <div className="wow-selection-title">{sel.title}</div>
        <div className="wow-selection-badges">
          {sel.isForClient && <span className="badge badge-client">Для клиента</span>}
          {sel.status && <span className="badge badge-status">{sel.status}</span>}
        </div>
        <div className="wow-selection-count">{sel.properties?.length || 0} объектов</div>
        <div className="wow-selection-actions">
          <button className="wow-btn" onClick={e => { e.stopPropagation(); onView(sel); }} title="Посмотреть"><FolderOpenOutlined /></button>
          <button className="wow-btn" onClick={e => { e.stopPropagation(); /* PDF */ }} title="Скачать PDF"><FilePdfOutlined /></button>
          <button className="wow-btn danger" onClick={e => { e.stopPropagation(); onDelete(sel); }} title="Удалить"><DeleteOutlined /></button>
        </div>
      </div>
      <style>{`
        .wow-selection-card {
          background: rgba(255,255,255,0.25);
          box-shadow: 0 8px 32px 0 rgba(31,38,135,0.15);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.18);
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s;
          animation: wow-fadein 0.7s cubic-bezier(.4,2,.6,1);
        }
        .wow-selection-card:hover {
          transform: scale(1.035) translateY(-2px);
          box-shadow: 0 12px 36px 0 rgba(31,38,135,0.22);
        }
        @keyframes wow-fadein {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: none; }
        }
        .wow-selection-collage {
          position: relative;
          height: 120px;
          background: #f5f7fa;
          border-radius: 24px 24px 0 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 12px 0 0 12px;
        }
        .collage-img {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 16px;
          box-shadow: 0 2px 8px #e6eaf1;
          position: absolute;
          top: 12px;
          left: 0;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .collage-img-0 { left: 0; }
        .collage-img-1 { left: 36px; }
        .collage-img-2 { left: 72px; }
        .collage-img-3 { left: 108px; }
        .collage-img.single { position: static; left: 0; }
        .wow-selection-content {
          padding: 24px 24px 18px 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .wow-selection-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #222;
          margin-bottom: 2px;
        }
        .wow-selection-badges {
          display: flex;
          gap: 8px;
          margin-bottom: 2px;
        }
        .badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          background: #e0e7ff;
          color: #3b3b7a;
        }
        .badge-client {
          background: #d1fae5;
          color: #047857;
        }
        .badge-status {
          background: #fef3c7;
          color: #b45309;
        }
        .wow-selection-count {
          font-size: 1.1rem;
          color: #555;
          margin-bottom: 8px;
        }
        .wow-selection-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .wow-btn {
          background: #fff;
          border: none;
          border-radius: 50%;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          box-shadow: 0 1px 4px #e6eaf1;
          cursor: pointer;
          transition: box-shadow 0.18s, background 0.18s, transform 0.18s;
        }
        .wow-btn:hover {
          background: #e0e7ff;
          box-shadow: 0 2px 8px #b4b8e6;
          transform: scale(1.12);
        }
        .wow-btn.danger:hover {
          background: #fee2e2;
          box-shadow: 0 2px 8px #fca5a5;
        }
      `}</style>
    </div>
  );
};

function areEqualSelection(prevProps: SelectionCardProps, nextProps: SelectionCardProps) {
  return (
    prevProps.sel.id === nextProps.sel.id &&
    prevProps.sel.updatedAt === nextProps.sel.updatedAt
  );
}

const MemoSelectionCard = React.memo(SelectionCard, areEqualSelection);

const SelectionPage: React.FC = () => {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewSelection, setViewSelection] = useState<Selection | null>(null);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [clientLikes, setClientLikes] = useState<{ propertyId: number; liked: boolean }[]>([]);

  useEffect(() => {
    setLoading(true);
    fetchSelections().then(data => {
      setSelections(data);
      setLoading(false);
    });
    getAllProperties().then(setAllProperties);
  }, [modalOpen]);

  useEffect(() => {
    if (viewSelection) {
      getSelectionById(viewSelection.id).then(sel => {
        setClientToken(sel.clientToken || null);
      });
      getClientLikes(viewSelection.id).then(setClientLikes);
    } else {
      setClientToken(null);
      setClientLikes([]);
    }
  }, [viewSelection]);

  const handleCreateModalClose = () => {
    setModalOpen(false);
    fetchSelections().then(setSelections);
    if (viewSelection) {
      getSelectionById(viewSelection.id).then(sel => setViewSelection(sel));
    }
  };

  const handleViewSelection = (sel: Selection) => {
    setViewSelection(sel);
  };

  const handleViewClose = () => {
    setViewSelection(null);
  };

  const handleCopyLink = () => {
    if (clientToken) {
      const link = getClientLink(clientToken);
      navigator.clipboard.writeText(link);
      message.success('Ссылка для клиента скопирована!');
    }
  };

  const handleDownloadPdf = () => {
    if (viewSelection) {
      downloadSelectionPdf(viewSelection.id);
      message.success('PDF-файл формируется и будет скачан');
    }
  };

  const getLikeStatus = (propertyId: number) => {
    const like = clientLikes.find(l => l.propertyId === propertyId);
    if (!like) return null;
    return like.liked;
  };

  const handleRemoveProperty = async (propertyId: number) => {
    if (!viewSelection) return;
    await removePropertyFromSelection(viewSelection.id, propertyId);
    message.success('Объект удалён из подборки');
    // Обновить подборку
    getSelectionById(viewSelection.id).then(sel => setViewSelection(sel));
  };

  const handleDeleteSelection = async () => {
    if (!viewSelection) return;
    Modal.confirm({
      title: 'Удалить подборку?',
      content: 'Вы уверены, что хотите удалить эту подборку? Это действие необратимо.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        await deleteSelection(viewSelection.id);
        message.success('Подборка удалена');
        setViewSelection(null);
        fetchSelections().then(setSelections);
      },
    });
  };

  function getThumbnail(photo: string | undefined): string | undefined {
    if (!photo) return undefined;
    if (photo.startsWith('/uploads/objects/')) {
      const parts = photo.split('/');
      return ['/uploads', 'objects', 'thumbnails', ...parts.slice(3)].join('/');
    }
    return undefined;
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', padding: '32px 40px 0 40px', background: 'var(--background-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0 }}>Подборки объектов</Title>
        <Button data-testid="selection-create-btn" type="primary" size="large" style={{ borderRadius: 10, fontWeight: 600 }} onClick={() => setModalOpen(true)}>
          Создать подборку
        </Button>
      </div>
      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />
      ) : selections.length === 0 ? (
        <Empty description="У вас пока нет подборок" style={{ marginTop: 60 }} />
      ) : (
        <Row gutter={[32, 32]}>
          {selections.map(sel => (
            <Col xs={24} sm={12} md={8} lg={6} key={sel.id} className="selection-card">
              <MemoSelectionCard sel={sel} onView={handleViewSelection} onDelete={(sel) => {
                Modal.confirm({
                  title: 'Удалить подборку?',
                  content: 'Вы уверены, что хотите удалить эту подборку? Это действие необратимо.',
                  okText: 'Удалить',
                  okType: 'danger',
                  cancelText: 'Отмена',
                  onOk: async () => {
                    await deleteSelection(sel.id);
                    message.success('Подборка удалена');
                    if (viewSelection?.id === sel.id) setViewSelection(null);
                    fetchSelections().then(setSelections);
                  },
                });
              }} />
            </Col>
          ))}
        </Row>
      )}
      <AddToSelectionModal open={modalOpen} onClose={handleCreateModalClose} createOnly />
      <Modal open={!!viewSelection} onCancel={handleViewClose} footer={null} title={viewSelection?.title || ''} width={1100}>
        <div style={{ marginBottom: 16, color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Создана: {viewSelection?.date}</span>
          <span style={{ display: 'flex', gap: 12 }}>
            {clientToken && (
              <Tooltip title="Скопировать ссылку для клиента">
                <Button icon={<LinkOutlined />} onClick={handleCopyLink} style={{ marginRight: 8 }} />
              </Tooltip>
            )}
            <Tooltip title="Скачать PDF">
              <Button icon={<FilePdfOutlined />} onClick={handleDownloadPdf} />
            </Tooltip>
          </span>
        </div>
        <List
          grid={{ gutter: 32, column: 2 }}
          bordered={false}
          dataSource={viewSelection ? viewSelection.propertyIds.map(id => allProperties.find(p => Number(p.id) === Number(id))).filter((p): p is Property => Boolean(p)) : []}
          renderItem={(item: Property) => {
            if (viewSelection) {
              console.log('propertyIds:', viewSelection.propertyIds);
              console.log('allProperties:', allProperties.map(p => p.id));
            }
            const likeStatus = getLikeStatus(item.id);
            return (
              <List.Item style={{ padding: 0, position: 'relative' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#fff',
                  border: '1px solid #e6eaf1',
                  borderRadius: 18,
                  boxShadow: '0 2px 8px rgba(40,60,90,0.04)',
                  padding: 0,
                  overflow: 'hidden',
                  minHeight: 180,
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                  margin: 0,
                  position: 'relative',
                }}>
                  <OptimizedImage
                    src={getThumbnail(item.photos && item.photos[0]) || (item.photos && item.photos[0]) || '/placeholder-property.jpg'}
                    alt={item.title}
                    width={200}
                    height={150}
                    style={{ objectFit: 'cover', borderRadius: '18px 0 0 18px', flexShrink: 0, background: '#f5f5f5' }}
                    lazy={true}
                    fallback="/placeholder-property.jpg"
                  />
                  <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 20, color: '#222' }}>{item.title}</span>
                      <Tooltip title="Удалить объект из подборки">
                        <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleRemoveProperty(item.id)} />
                      </Tooltip>
                    </div>
                    <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>{item.address}</div>
                    <div style={{ color: '#222', fontSize: 16, marginBottom: 4 }}><b>Цена:</b> {item.price} ₽</div>
                    <div style={{ color: '#222', fontSize: 16 }}><b>Площадь:</b> {item.area} м²</div>
                    <div style={{ position: 'absolute', top: 18, right: 24, display: 'flex', gap: 8 }}>
                      {likeStatus === true && <Tooltip title="Понравилось"><LikeOutlined style={{ color: '#22c55e', fontSize: 22 }} /></Tooltip>}
                      {likeStatus === false && <Tooltip title="Не понравилось"><DislikeOutlined style={{ color: '#f44336', fontSize: 22 }} /></Tooltip>}
                      {likeStatus === null && <Tooltip title="Нет ответа"><QuestionCircleOutlined style={{ color: '#bbb', fontSize: 22 }} /></Tooltip>}
                    </div>
                  </div>
                </div>
              </List.Item>
            );
          }}
          locale={{ emptyText: 'В подборке пока нет объектов' }}
        />
      </Modal>
      <style>{`
        @media (max-width: 767px) {
          .selection-card {
            margin-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default SelectionPage; 