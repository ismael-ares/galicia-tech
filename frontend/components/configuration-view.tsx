'use client';
import {useEffect,useState} from 'react';
import {AlertCircle,Check,Code2,FileCode2,LockKeyhole,RefreshCw,Settings2} from 'lucide-react';
import {api} from '@/lib/api';
import type {ProcessingConfig} from '@/lib/data';
import {AdminGate,useApp} from './shell';
import {useI18n} from './i18n';

export function ConfigurationView(){
 const {t}=useI18n();const {user,requireAdminMfa}=useApp();const [config,setConfig]=useState<ProcessingConfig|null>(null),[error,setError]=useState('');
 useEffect(()=>{if(user?.role==='admin'&&(!requireAdminMfa||user.mfaEnabled))api<ProcessingConfig>('/api/v1/admin/configuration/').then(setConfig).catch(error=>setError(error.message));},[user,requireAdminMfa]);
 const enabled=(value:boolean)=>t(value?'Activado':'Desactivado');
 const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
 const row=(label:string,value:React.ReactNode)=><div className="yaml-value" key={label}><dt>{t(label)}</dt><dd>{value}</dd></div>;
 return <AdminGate><div className="page-heading compact"><div><h1>{t('Configuración')}<span className="heading-dot">.</span></h1><p>{t('Política de la aplicación versionada en el repositorio.')}</p></div><span className="pill"><LockKeyhole size={13}/>{t('Solo lectura')}</span></div>{error&&<p className="error-message" role="alert">{error}</p>}{config?<div className="yaml-config">
  <section className="yaml-file"><FileCode2 size={29}/><div><strong>{config.file}</strong><span>{t('Perfil')}: <b>{config.profile}</b> · {t('Revisión')}: <code>{config.revision.slice(0,12)}</code></span></div><span className={'yaml-status '+(config.fileStatus==='active'?'':'is-warning')}>{config.fileStatus==='active'?<Check size={15}/>:<AlertCircle size={15}/>} {t(config.fileStatus==='active'?'Aplicada':config.fileStatus==='pending'?'Cambios pendientes':'YAML inválido')}</span></section>
  {config.warning&&<div className="inline-note warning yaml-warning" role="status"><AlertCircle size={18}/><div><p>{t(config.warning)}</p>{config.validationError&&<code>{config.validationError}</code>}</div></div>}
  <div className="yaml-sections"><section className="panel"><div className="panel-title"><Settings2 size={20}/><h2>{t('Fuentes y consultas')}</h2></div><dl>{row('Fuentes definidas',config.sourceCount)}{row('Consulta automática',enabled(config.collection.enabled))}{row('Frecuencia',t(config.retrieval==='daily'?'Una vez al día':'Dos veces por semana'))}{config.retrieval==='twice-weekly'&&row('Días de consulta',config.collection.weekdays.map(day=>t(days[day])).join(' · '))}{row('Intervalo mínimo',config.collection.min_interval_hours+' h')}{row('Comprobación de pendientes',config.collection.scheduler_minutes+' min')}</dl></section>
  <section className="panel"><h2>{t('Procesamiento con LLM')}</h2><p>{t('Parámetros reservados para la integración LLM. No se realizan llamadas de pago.')}</p><dl>{row('Frecuencia prevista',t(config.frequency==='twice-weekly'?'Dos veces por semana':'Cada tres días'))}{row('Tope mensual',config.budget+' €')}{row('Llamadas pagadas',t('Desactivadas'))}</dl></section>
  <section className="panel"><h2>{t('Acceso y sesiones')}</h2><dl>{row('Registro de cuentas',enabled(config.access.registration))}{row('Cuentas locales de prueba',enabled(config.access.local_test_accounts))}{row('MFA en administración',enabled(config.access.require_admin_mfa))}{row('Inactividad máxima',config.access.session_idle_minutes+' min')}{row('Duración máxima',config.access.session_max_hours+' h')}{row('Límite de autenticación',config.access.auth_attempts+' / '+config.access.auth_window_seconds+' s')}</dl></section>
  <section className="panel"><h2>{t('Límites de descarga')}</h2><dl>{row('Tamaño máximo por página',(config.fetch.max_bytes/1000000).toLocaleString()+' MB')}{row('Fichas por fuente',config.collection.max_details)}{row('Eventos por consulta',config.collection.max_events)}{row('Tiempo por fuente',config.collection.source_deadline_seconds+' s')}{row('Conexión / lectura',config.fetch.connect_timeout_seconds+' / '+config.fetch.read_timeout_seconds+' s')}{row('Redirecciones',config.fetch.max_redirects)}</dl><p className="yaml-hosts"><strong>{t('Dominios permitidos')}</strong>{config.fetch.allowed_hosts.join(' · ')}</p></section></div>
  <details className="yaml-document"><summary><Code2 size={17}/>{t('Ver configuración activa')}</summary><pre>{config.yaml}</pre></details>
  <section className="yaml-workflow"><RefreshCw size={20}/><div><h2>{t('Cambiar la configuración')}</h2><p>{t('Edita el YAML, valida el archivo y reinicia backend y worker. El arranque sincroniza las fuentes sin borrar eventos, revisiones ni datos personales.')}</p><small>{t('Las claves y contraseñas se mantienen fuera del YAML y del repositorio.')}</small></div></section>
 </div>:!error&&<div className="empty-state" role="status">{t('Cargando configuración…')}</div>}</AdminGate>;
}
