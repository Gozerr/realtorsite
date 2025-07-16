import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Button, Typography, Row, Col, Card, Alert, Modal, Upload, Select, message, Tabs, Progress } from 'antd';
import { PlusOutlined, InboxOutlined, PictureOutlined, SafetyCertificateOutlined, QuestionCircleOutlined, UserOutlined, PhoneOutlined, MailOutlined, LockOutlined, BankOutlined } from '@ant-design/icons';
import InputMask from 'react-input-mask';
import { AuthContext } from '../context/AuthContext';
import { login, getProfile, register } from '../services/auth.service';
import { setupAuthAutoRefresh } from '../services/api';
import agenciesList from '../data/agencies_yaroslavl.json';
import SupportModal from '../components/SupportModal';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { Form as AntForm } from 'antd';
import { Divider } from 'antd';
import TelegramLinkModal from '../components/TelegramLinkModal';
import TelegramLoginButton from '../components/TelegramLoginButton';

const { Title, Text } = Typography;

const AGENCY_SEARCH_URL = '/api/agencies?search=';

// Role options with proper labels
const ROLE_OPTIONS = [
  { value: 'director', label: 'Директор' },
  { value: 'manager', label: 'Руководитель' },
  { value: 'agent', label: 'Агент по недвижимости' },
  { value: 'private_realtor', label: 'Частный риэлтор' },
];

// Password validation rules
const passwordRules = [
  { required: true, message: 'Введите пароль' },
  { min: 8, message: 'Пароль должен быть не менее 8 символов' },
  {
    pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/,
    message: 'Пароль должен содержать буквы, цифры и хотя бы один спецсимвол',
  },
];

// Error boundary for registration modal
class RegistrationErrorBoundary extends React.Component<any, { error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('RegistrationErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.error) {
      return <div style={{ color: 'red', padding: 24 }}>Ошибка: {String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}

// Add TS declaration for window.__registerForm
declare global {
  interface Window {
    __registerForm: any;
  }
}

// Кастомный компонент для интеграции InputMask с AntD Form
interface MaskedInputFieldProps {
  name: string;
  mask: string;
  placeholder?: string;
}
const MaskedInputField: React.FC<MaskedInputFieldProps> = ({ name, mask, placeholder }) => {
  const form = AntForm.useFormInstance();
  const value = AntForm.useWatch(name, form);
  return (
    <InputMask
      mask={mask}
      maskChar={null}
      value={value || ''}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        form.setFieldValue(name, e.target.value);
        // Принудительно вызываем валидацию
        form.validateFields([name]);
      }}
    >
      {(inputProps: any) => <Input {...inputProps} placeholder={placeholder} />}
    </InputMask>
  );
};

const initialFormValues = {
  lastName: '',
  firstName: '',
  middleName: '',
  email: '',
  phone: '+7 (',
  telegramUsername: '',
  whatsappNumber: '+7 (',
  agency: undefined,
  agencies: [],
  role: '',
  position: '',
  password: '',
  confirmPassword: '',
  photo: [],
  documents: [],
  logo: []
};

// Main registration form component
const RegisterForm: React.FC<{ onSuccess: () => void; form: any }> = ({ onSuccess, form }) => {
  const [role, setRole] = useState<string>('');

  const agencyOptions = agenciesList.map((name: string) => ({ value: name, label: name }));

  useEffect(() => {
    window.__registerForm = form;
  }, [form]);

  // Отслеживаем изменения формы
  useEffect(() => {
    const values = form.getFieldsValue();
    console.log('Form values updated:', values);
  }, [form]);

  // Custom validators
  const validateAgencies = (_: any, value: any) => {
    if (role === 'private_realtor') {
      if (!value || value.length !== 3) {
        return Promise.reject('Выберите ровно 3 агентства для поручительства');
      }
    } else {
      if (!value) {
        return Promise.reject('Выберите агентство');
      }
    }
    return Promise.resolve();
  };

  const validateDocuments = (_: any, value: any) => {
    if ((role === 'director' || role === 'private_realtor') && (!value || value.length === 0)) {
      return Promise.reject('Загрузите документы');
    }
    return Promise.resolve();
  };

  const validatePhoto = (_: any, value: any) => {
    if (!value || value.length === 0) {
      return Promise.reject('Загрузите фотографию');
    }
    return Promise.resolve();
  };

  // Form submission
  const onFinish = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append('firstName', values.firstName);
      formData.append('lastName', values.lastName);
      formData.append('middleName', values.middleName);
      formData.append('email', values.email);
      formData.append('phone', values.phone);
      formData.append('password', values.password);
      formData.append('role', values.role);
      if (values.telegramUsername) formData.append('telegramUsername', values.telegramUsername);
      if (values.whatsappNumber) formData.append('whatsappNumber', values.whatsappNumber);
      if (role === 'private_realtor') {
        values.agencies.forEach((agency: string) => formData.append('agencies', agency));
      } else {
        formData.append('agencyName', values.agency);
      }
      if (role !== 'private_realtor' && values.position) {
        formData.append('position', values.position);
      }
      if (values.photo && values.photo.length > 0 && values.photo[0].originFileObj) {
        formData.append('photo', values.photo[0].originFileObj);
      }
      if ((role === 'director' || role === 'private_realtor') && values.logo && values.logo.length > 0 && values.logo[0].originFileObj) {
        formData.append('logo', values.logo[0].originFileObj);
      }
      if (values.documents && values.documents.length > 0) {
        values.documents.forEach((file: any) => {
          if (file.originFileObj) {
            formData.append('documents', file.originFileObj);
          }
        });
      }
      // Логируем содержимое formData для отладки
      Array.from(formData.entries()).forEach(pair => {
        console.log(pair[0] + ':', pair[1]);
      });
      await register(formData);
      let successMessage = '';
      switch (role) {
        case 'director':
          successMessage = 'Регистрация прошла успешно! Ваша заявка отправлена в службу поддержки для проверки документов. Доступ будет открыт после проверки.';
          break;
        case 'agent':
        case 'manager':
          successMessage = 'Регистрация прошла успешно! Ваша заявка отправлена директору агентства для подтверждения. Доступ будет открыт после подтверждения.';
          break;
        case 'private_realtor':
          successMessage = 'Регистрация прошла успешно! Ваша заявка отправлена в службу поддержки и директорам выбранных агентств. Доступ будет открыт после всех проверок.';
          break;
        default:
          successMessage = 'Регистрация прошла успешно! Ожидайте подтверждения.';
      }
      message.success(successMessage);
      onSuccess();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Ошибка при регистрации';
      message.error(errorMessage);
      console.error('Registration error:', error);
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    message.error('Проверьте правильность заполнения всех обязательных полей!');
  };

  // Проверка валидности формы для кнопки
  const isFormValid = () => {
    const values = form.getFieldsValue();
    const errors = form.getFieldsError();
    
    console.log('=== FORM VALIDATION DEBUG ===');
    console.log('All form values:', values);
    console.log('All form errors:', errors);
    console.log('Current role:', role);
    
    if (errors.some((error: any) => error.errors.length > 0)) {
      console.log('❌ Form has validation errors:', errors);
      return false;
    }
    
    const requiredFields = ['firstName', 'lastName', 'middleName', 'email', 'phone', 'password', 'confirmPassword'];
    console.log('Checking required fields...');
    for (const field of requiredFields) {
      if (!values[field]) {
        console.log(`❌ Missing required field: ${field} (value: ${values[field]})`);
        return false;
      } else {
        console.log(`✅ Field ${field}: ${values[field]}`);
      }
    }
    
    if (role === 'private_realtor') {
      if (!values.agencies || values.agencies.length !== 3) {
        console.log(`❌ Private realtor needs exactly 3 agencies, got: ${values.agencies?.length || 0}`);
        return false;
      } else {
        console.log(`✅ Private realtor agencies: ${values.agencies.length}`);
      }
    } else if (role && role !== 'private_realtor') {
      if (!values.agency) {
        console.log(`❌ Non-private realtor needs agency, got: ${values.agency}`);
        return false;
      } else {
        console.log(`✅ Agency selected: ${values.agency}`);
      }
    }
    
    if (!values.photo || values.photo.length === 0) {
      console.log(`❌ Photo is required, got: ${values.photo?.length || 0} files`);
      return false;
    } else {
      console.log(`✅ Photo uploaded: ${values.photo.length} files`);
    }
    
    if ((role === 'director' || role === 'private_realtor') && (!values.documents || values.documents.length === 0)) {
      console.log(`❌ Documents required for ${role}, got: ${values.documents?.length || 0} files`);
      return false;
    } else if (role === 'director' || role === 'private_realtor') {
      console.log(`✅ Documents uploaded: ${values.documents?.length || 0} files`);
    }
    
    console.log('✅ Form is valid!');
    return true;
  };

  // Debug panel
  const DebugPanel = ({ form }: { form: any }) => {
    const values = AntForm.useWatch([], form) as any;
    const errors = form ? form.getFieldsError() : [];
    const isValid = errors.every((error: any) => error.errors.length === 0);
    const formValid = isFormValid();
    
    return (
      <div style={{ background: '#f7f7f7', border: '1px solid #eee', padding: 12, marginTop: 16, fontSize: 12 }}>
        <b>DEBUG:</b>
        <div>Values: <pre>{JSON.stringify(values, null, 2)}</pre></div>
        <div>Errors: <pre>{JSON.stringify(errors, null, 2)}</pre></div>
        <div>Form validation errors: {isValid ? '✅ None' : '❌ Has errors'}</div>
        <div>Submit button enabled: {formValid ? '✅ Yes' : '❌ No'}</div>
        <div>Current role: {role || 'Not selected'}</div>
        <div>Missing fields for role "{role}":</div>
        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
          {values && !values.password && <li>❌ password</li>}
          {values && !values.confirmPassword && <li>❌ confirmPassword</li>}
          {values && role === 'director' && !values.agency && <li>❌ agency</li>}
          {values && role === 'director' && (!values.documents || values.documents.length === 0) && <li>❌ documents</li>}
          {values && role === 'private_realtor' && (!values.agencies || values.agencies.length !== 3) && <li>❌ agencies (need exactly 3)</li>}
          {values && role === 'private_realtor' && (!values.documents || values.documents.length === 0) && <li>❌ documents</li>}
        </ul>
      </div>
    );
  };

  return (
    <>
      <Form
        name="register"
        form={form}
        initialValues={initialFormValues}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        requiredMark={true}
        autoComplete="off"
        style={{ marginTop: 8 }}
        onValuesChange={(changedValues, allValues) => {
          console.log('Form values changed:', changedValues, 'All values:', allValues);
          // Принудительно обновляем состояние формы
          form.validateFields();
        }}
      >
        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Form.Item label="Фамилия" name="lastName" rules={[{ required: true, message: 'Введите фамилию' }]}> 
              <Input 
                autoComplete="off" 
                onChange={e => form.setFieldValue('lastName', e.target.value)}
              /> 
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Имя" name="firstName" rules={[{ required: true, message: 'Введите имя' }]}> 
              <Input 
                autoComplete="off" 
                onChange={e => form.setFieldValue('firstName', e.target.value)}
              /> 
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Отчество" name="middleName" rules={[{ required: true, message: 'Введите отчество' }]}> 
              <Input 
                autoComplete="off" 
                onChange={e => form.setFieldValue('middleName', e.target.value)}
              /> 
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Телефон" name="phone" rules={[{ required: true, message: 'Введите телефон' }]}> 
              <MaskedInputField name="phone" mask="+7 (999) 999-99-99" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Telegram username" name="telegramUsername"> 
              <Input 
                placeholder="username (без @)" 
                autoComplete="off" 
                onChange={e => form.setFieldValue('telegramUsername', e.target.value)}
              /> 
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="WhatsApp номер" name="whatsappNumber"> 
              <MaskedInputField name="whatsappNumber" mask="+7 (999) 999-99-99" placeholder="+7 (XXX) XXX-XX-XX" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Введите корректный email' }]}> 
              <Input 
                autoComplete="off" 
                onChange={e => form.setFieldValue('email', e.target.value)}
              /> 
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Роль" name="role" rules={[{ required: true, message: 'Выберите роль' }]}> 
              <Select 
                options={ROLE_OPTIONS} 
                value={role}
                onChange={val => {
                  setRole(val);
                  form.setFieldValue('role', val);
                }} 
                placeholder="Выберите роль" 
              /> 
            </Form.Item>
          </Col>
          {role && role !== 'private_realtor' && role !== 'director' && (
            <Col xs={24} sm={12}>
              <Form.Item label="Должность" name="position" rules={[{ required: true, message: 'Выберите должность' }]}> 
                <Select 
                  options={ROLE_OPTIONS.filter(opt => opt.value !== 'private_realtor')} 
                  onChange={val => form.setFieldValue('position', val)} 
                  placeholder="Выберите должность" 
                /> 
              </Form.Item>
            </Col>
          )}
          {role && (
            <Col xs={24} sm={12}>
              <Form.Item label={role === 'private_realtor' ? "Выберите 3 агентства для поручительства (обязательно)" : "Выберите агентство (обязательно)"} name={role === 'private_realtor' ? 'agencies' : 'agency'} rules={[{ validator: validateAgencies }]}> 
                {role === 'private_realtor' ? (
                  <Select 
                    mode="multiple" 
                    showSearch 
                    placeholder="Выберите 3 агентства..." 
                    options={agencyOptions} 
                    filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())} 
                    maxTagCount={3} 
                    onChange={val => form.setFieldValue('agencies', val)}
                  />
                ) : (
                  <Select 
                    showSearch 
                    placeholder="Выберите агентство..." 
                    options={agencyOptions} 
                    filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())} 
                    onChange={val => form.setFieldValue('agency', val)}
                  />
                )}
              </Form.Item>
            </Col>
          )}
          <Col xs={24} sm={12}>
            <Form.Item label={<span style={{ color: '#ff4d4f' }}>Фотография (обязательно)</span>} name="photo" rules={[{ validator: validatePhoto }]} valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}>
              <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} accept="image/*" onChange={info => form.setFieldValue('photo', info.fileList)}>
                <div><PlusOutlined /> <div style={{ marginTop: 8 }}>Загрузить фото</div></div>
              </Upload>
            </Form.Item>
          </Col>
          {(role === 'director' || role === 'private_realtor') && (
            <Col xs={24} sm={12}>
              <Form.Item label="Логотип (необязательно)" name="logo" valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}>
                <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} accept="image/*" onChange={info => form.setFieldValue('logo', info.fileList)}>
                  <div><PictureOutlined /> <div style={{ marginTop: 8 }}>Загрузить логотип</div></div>
                </Upload>
              </Form.Item>
            </Col>
          )}
          {(role === 'director' || role === 'private_realtor') && (
            <Col xs={24} sm={24}>
              <Form.Item label={<span style={{ color: '#ff4d4f' }}>{role === 'director' ? 'Учредительные документы (обязательно)' : 'Подтверждающие документы (обязательно)'}</span>} name="documents" rules={[{ validator: validateDocuments }]} valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}>
                <Upload.Dragger name="docs" maxCount={5} beforeUpload={() => false} accept=".pdf,.jpg,.jpeg,.png" onChange={info => form.setFieldValue('documents', info.fileList)}>
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p> <p className="ant-upload-text">Перетащите файлы или кликните для выбора</p> <p className="ant-upload-hint">PDF, JPG, PNG. Можно загрузить несколько файлов.</p>
                </Upload.Dragger>
              </Form.Item>
            </Col>
          )}
          <Col xs={24} sm={12}>
            <Form.Item label="Пароль" name="password" rules={passwordRules} hasFeedback> 
              <Input.Password 
                placeholder="Введите пароль" 
                autoComplete="off" 
                onChange={e => form.setFieldValue('password', e.target.value)}
              /> 
            </Form.Item>
            <div style={{ fontSize: 12, color: '#888', marginTop: -12, marginBottom: 12 }}>Минимум 8 символов, буквы, цифры и хотя бы один спецсимвол (!@#$%^&* и др.)</div>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Повторите пароль" name="confirmPassword" dependencies={["password"]} hasFeedback rules={[{ required: true, message: 'Повторите пароль' }, ({ getFieldValue }) => ({ validator(_: any, value: any) { if (!value || getFieldValue('password') === value) { return Promise.resolve(); } return Promise.reject(new Error('Пароли не совпадают')); }, }), ]}> 
              <Input.Password 
                placeholder="Повторите пароль" 
                autoComplete="off" 
                onChange={e => form.setFieldValue('confirmPassword', e.target.value)}
              /> 
            </Form.Item>
          </Col>
        </Row>
        <Form.Item shouldUpdate>
          {() => (
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: '100%' }}
              disabled={!isFormValid()}
            >
              Зарегистрироваться
            </Button>
          )}
        </Form.Item>
      </Form>
      <DebugPanel form={form} />
    </>
  );
};

// Remove the old PrivateRealtorRegisterForm since it's now integrated into the main form

const RegisterTabs: React.FC<{ onSuccess: () => void; form: any }> = ({ onSuccess, form }) => (
  <RegisterForm onSuccess={onSuccess} form={form} />
);

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [registerForm] = Form.useForm();
  const authContext = useContext(AuthContext);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    setError('');
    try {
      const data = await login({ email: values.email, password: values.password }, { withCredentials: true });
      console.log('[LOGIN] access_token:', data.access_token);
      try {
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        console.log('[LOGIN] JWT payload:', payload);
      } catch (e) {
        console.warn('[LOGIN] Не удалось декодировать JWT:', e);
      }
      const profile = await getProfile(data.access_token);
      authContext?.setAuthData(data.access_token, profile);
      setupAuthAutoRefresh();
    } catch (err: any) {
      let msg = 'Произошла ошибка при входе в систему';
      
      // Обрабатываем различные типы ошибок
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.response?.status === 401) {
        msg = 'Логин и/или пароль введены неверно';
      } else if (err?.response?.status === 500) {
        msg = 'Ошибка сервера. Попробуйте позже';
      } else if (err?.message) {
        msg = err.message;
      }
      
      setError(msg);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramSuccess = (token: string, user: any) => {
    authContext?.setAuthData(token, user);
    setShowTelegramModal(false);
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', margin: 0, padding: 0 }}>
      <Col xs={24} sm={24} md={24} lg={24} xl={24} style={{ padding: 0, margin: 0 }}>
        <Card style={{ boxShadow: 'none', border: 'none', maxWidth: '100vw', width: '100%', margin: 0, padding: 0 }} bodyStyle={{ padding: 0 }}>
          <Title level={2} style={{ textAlign: 'center', marginTop: 24 }}>Вход в систему</Title>
          
          {/* Предупреждение о безопасности */}
          <Alert
            message={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafetyCertificateOutlined style={{ color: '#faad14' }} />
                <span style={{ fontWeight: 500 }}>Важная информация о безопасности</span>
              </div>
            }
            description={
              <div style={{ marginTop: 8 }}>
                <div style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                  <strong>Внимание!</strong> Передача ваших учетных данных (логин и пароль) третьим лицам категорически запрещена и приведет к немедленной блокировке аккаунта.
                </div>
                <div style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
                  • Каждый пользователь должен использовать только свои личные учетные данные<br/>
                  • Запрещено предоставлять доступ к аккаунту коллегам, клиентам или другим лицам<br/>
                  • Система отслеживает подозрительную активность и автоматически блокирует нарушителей<br/>
                  • При необходимости смены устройства обратитесь в службу поддержки
                </div>
              </div>
            }
            type="warning"
            showIcon={false}
            style={{ 
              margin: '0 auto 24px auto', 
              maxWidth: 400,
              borderRadius: 8,
              border: '1px solid #faad14',
              backgroundColor: '#fffbe6'
            }}
          />
          
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
            preserve={false}
            style={{ maxWidth: 400, margin: '0 auto' }}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, type: 'email', message: 'Введите корректный email!' }]}
            >
              <Input data-testid="login-email" autoFocus />
            </Form.Item>

            <Form.Item
              label="Пароль"
              name="password"
              rules={[{ required: true, message: 'Введите пароль!' }]}
            >
              <Input.Password data-testid="login-password" />
            </Form.Item>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Button 
                type="link" 
                size="small"
                onClick={() => setForgotPasswordVisible(true)}
                style={{ padding: 0, height: 'auto' }}
              >
                Забыли пароль?
              </Button>
            </div>

            {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

            <Form.Item>
              <Button data-testid="login-submit" type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                Войти
              </Button>
            </Form.Item>
            <Divider plain style={{ margin: '16px 0' }}>или</Divider>
            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              {/* Новый универсальный Telegram Login Widget */}
              <TelegramLoginButton onSuccess={handleTelegramSuccess} onError={() => setError('Ошибка Telegram авторизации. Попробуйте позже или обратитесь в поддержку.')} />
            </div>
          </Form>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="link" style={{ marginRight: 16 }} onClick={() => setRegisterOpen(true)}>
              Регистрация
            </Button>
            <Button 
              type="link" 
              icon={<QuestionCircleOutlined />}
              onClick={() => setSupportModalVisible(true)}
            >
              Служба поддержки
            </Button>
          </div>
        </Card>
      </Col>
      <Modal
        open={registerOpen}
        onCancel={() => setRegisterOpen(false)}
        footer={null}
        centered={false}
        width="100vw"
        style={{ top: 0, padding: 0, maxWidth: '100vw' }}
        bodyStyle={{ padding: 0, minHeight: '100vh', background: '#fff' }}
        maskStyle={{ background: 'rgba(0,0,0,0.25)' }}
        closable={true}
      >
        <RegistrationErrorBoundary>
          <div style={{ width: '100vw', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0 }}>
            <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: 32 }}>
              <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>Регистрация пользователя</Title>
              
              {/* Предупреждение о безопасности для регистрации */}
              <Alert
                message={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SafetyCertificateOutlined style={{ color: '#faad14' }} />
                    <span style={{ fontWeight: 500 }}>Правила безопасности</span>
                  </div>
                }
                description={
                  <div style={{ marginTop: 8 }}>
                    <div style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                      <strong>Важно!</strong> После регистрации вы получите доступ к профессиональной платформе. Помните о правилах безопасности:
                    </div>
                    <div style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#666' }}>
                      • Используйте только свои личные учетные данные<br/>
                      • Не передавайте логин и пароль третьим лицам<br/>
                      • Система автоматически отслеживает подозрительную активность<br/>
                      • При смене устройства обращайтесь в поддержку
                    </div>
                  </div>
                }
                type="warning"
                showIcon={false}
                style={{ 
                  marginBottom: 24,
                  borderRadius: 8,
                  border: '1px solid #faad14',
                  backgroundColor: '#fffbe6'
                }}
              />
              
              <RegisterTabs onSuccess={() => setRegisterOpen(false)} form={registerForm} />
            </div>
          </div>
        </RegistrationErrorBoundary>
      </Modal>
      
      <SupportModal 
        visible={supportModalVisible}
        onClose={() => setSupportModalVisible(false)}
      />
      
      <ForgotPasswordModal
        visible={forgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
      />

      {/* Удаляю/скрываю Modal TelegramLinkModal и showTelegramModal */}
    </Row>
  );
};

export default LoginPage; 