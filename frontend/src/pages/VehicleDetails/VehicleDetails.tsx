import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCalendarDays, faClockRotateLeft, faGaugeHigh, faPenToSquare, faPlus, faRotate, faTrash } from "@fortawesome/free-solid-svg-icons";
import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { Modal } from "../../components/Modal/Modal";
import { useVehicleHistoryMutations, useVehicleMutations, useVehicleWithHistoryByPeriod } from "../../modules/vehicles/vehicles.hooks";
import type { CreateVehicleHistoryRequest, CreateVehicleRequest, VehicleEventType, VehicleHistoryEvent, UpdateVehicleOdometerRequest, UpdateVehicleRequest } from "../../modules/vehicles/vehicles.types";
import { VehicleFormModal } from "../Vehicles/components/VehicleFormModal";
import { VehicleHistoryFormModal } from "./components/VehicleHistoryFormModal";
import { VehicleOdometerModal } from "./components/VehicleOdometerModal";
import "./VehicleDetails.css";

const eventLabels:Record<VehicleEventType,string>={maintenance:"Manutenção",issue:"Problema identificado",observation:"Observação",problem_solved:"Problema resolvido",odometer_reset:"Reinicialização do hodômetro"};
const eventTones:Record<VehicleEventType,string>={maintenance:"info",issue:"warning",observation:"neutral",problem_solved:"success",odometer_reset:"warning"};
function dateInput(value:Date){const d=new Date(value.getTime()-value.getTimezoneOffset()*60000);return d.toISOString().slice(0,10);}
function formatDate(value?:string|null){if(!value)return "Não informado";const d=new Date(value.slice(0,10)+"T12:00:00");return Number.isNaN(d.getTime())?"Não informado":d.toLocaleDateString("pt-BR");}
function formatDateTime(value:string){const d=new Date(value);return Number.isNaN(d.getTime())?"Não informado":d.toLocaleString("pt-BR");}
function km(value:number|null){return value==null?"Não informado":new Intl.NumberFormat("pt-BR").format(value)+" km";}
function Info({label,value}:{label:string;value:string}){return <div className="vehicle-info"><span>{label}</span><strong title={value}>{value}</strong></div>;}

export function VehicleDetails(){
 const {vehicleId}=useParams<{vehicleId:string}>();const navigate=useNavigate();
 const today=new Date();const [startDate,setStartDate]=useState(dateInput(new Date(today.getFullYear(),today.getMonth(),1)));const [endDate,setEndDate]=useState(dateInput(today));
 const period=useMemo(()=>({startDate,endDate}),[startDate,endDate]);
 const query=useVehicleWithHistoryByPeriod(vehicleId,period);
 const vehicle=query.data;const vehicleMutations=useVehicleMutations();const historyMutations=useVehicleHistoryMutations();
 const [editOpen,setEditOpen]=useState(false);const [odometerOpen,setOdometerOpen]=useState(false);const [historyOpen,setHistoryOpen]=useState(false);
 const [actionError,setActionError]=useState<string|null>(null);
 const [editingEvent,setEditingEvent]=useState<VehicleHistoryEvent|null>(null);const [deletingEvent,setDeletingEvent]=useState<VehicleHistoryEvent|null>(null);const [deleteVehicleOpen,setDeleteVehicleOpen]=useState(false);
 const history=vehicle?.history??[];
 async function saveVehicle(data:CreateVehicleRequest){if(!vehicle)return;const update:UpdateVehicleRequest={title:data.title,plate:data.plate??null,renavam:data.renavam??null,crlv:data.crlv??null,crv:data.crv??null,observations:data.observations??null};await vehicleMutations.update.mutateAsync({id:vehicle.id,data:update});setEditOpen(false);setActionError(null);}
 async function saveOdometer(data:UpdateVehicleOdometerRequest){if(!vehicle)return;await vehicleMutations.updateOdometer.mutateAsync({id:vehicle.id,data});setOdometerOpen(false);setActionError(null);}
 async function saveHistory(data:CreateVehicleHistoryRequest){if(!vehicle)return;if(editingEvent)await historyMutations.update.mutateAsync({historyId:editingEvent.id,data});else await historyMutations.create.mutateAsync({vehicleId:vehicle.id,data});setHistoryOpen(false);setEditingEvent(null);setActionError(null);}
 async function confirmDeleteVehicle(){if(!vehicle)return;try{await vehicleMutations.remove.mutateAsync(vehicle.id);navigate("/vehicles");}catch(error){setActionError(error instanceof Error?error.message:"Não foi possível excluir o veículo.");}}
 async function confirmDeleteEvent(){if(!deletingEvent)return;try{await historyMutations.remove.mutateAsync(deletingEvent.id);setDeletingEvent(null);setActionError(null);}catch(error){setActionError(error instanceof Error?error.message:"Não foi possível excluir o evento.");}}
 if(query.isPending)return <main className="vehicle-details-page"><AppHeader/><div className="vehicle-details-state"><span className="vehicle-spinner"/>Carregando veículo…</div></main>;
 if(query.isError||!vehicle)return <main className="vehicle-details-page"><AppHeader/><div className="vehicle-details-content"><BackLink to="/vehicles" label="Voltar aos veículos"/><div className="vehicle-details-state vehicle-details-state--error"><strong>Não foi possível carregar este veículo.</strong><p>O veículo pode não existir ou você pode não ter acesso aos dados no momento.</p><button type="button" onClick={()=>void query.refetch()}><FontAwesomeIcon icon={faRotate}/> Tentar novamente</button><Link to="/vehicles"><FontAwesomeIcon icon={faArrowLeft}/> Voltar aos veículos</Link></div></div></main>;
 return <main className="vehicle-details-page">
  <title>{vehicle.title} | Blue Admin</title><AppHeader/><nav className="page-back-row"><BackLink to="/vehicles" label="Voltar aos veículos"/></nav>
  <section className="vehicle-details-content">
   {actionError&&<div className="vehicle-details-action-error" role="alert">{actionError}</div>}
   <header className="vehicle-details-heading"><div><span className="vehicle-details-eyebrow">Cadastro de veículo</span><h1>{vehicle.title}</h1><div className="vehicle-details-identity"><span>{vehicle.plate||"Sem placa"}</span><small>ID: {vehicle.id}</small></div></div><div className="vehicle-details-actions"><button type="button" onClick={()=>setEditOpen(true)}><FontAwesomeIcon icon={faPenToSquare}/> Editar</button><button type="button" onClick={()=>setOdometerOpen(true)}><FontAwesomeIcon icon={faGaugeHigh}/> Atualizar hodômetro</button><button className="vehicle-details-actions__danger" type="button" onClick={()=>{setActionError(null);setDeleteVehicleOpen(true);}}><FontAwesomeIcon icon={faTrash}/> Excluir veículo</button></div></header>
   <section className="vehicle-details-overview">
    <article className="vehicle-details-km"><span><FontAwesomeIcon icon={faGaugeHigh}/> Hodômetro atual</span><strong>{km(vehicle.currentKilometer)}</strong><small>Leitura cadastrada mais recente</small></article>
    <div className="vehicle-details-fields"><Info label="Placa" value={vehicle.plate||"Não informada"}/><Info label="RENAVAM" value={vehicle.renavam||"Não informado"}/><Info label="CRLV" value={vehicle.crlv||"Não informado"}/><Info label="CRV" value={vehicle.crv||"Não informado"}/><Info label="Cadastrado em" value={formatDate(vehicle.createdAt)}/><Info label="Última atualização" value={formatDate(vehicle.updatedAt)}/></div>
    {vehicle.observations&&<div className="vehicle-details-observations"><span>Observações</span><p>{vehicle.observations}</p></div>}
   </section>
   <section className="vehicle-details-history-panel">
    <header className="vehicle-details-section-heading"><div><span className="vehicle-details-eyebrow">Rastreabilidade</span><h2><FontAwesomeIcon icon={faClockRotateLeft}/> Histórico do veículo</h2><p>Consulte eventos pela data em que aconteceram, incluindo registros retroativos.</p></div><button className="vehicle-details-add-event" type="button" onClick={()=>{setEditingEvent(null);setHistoryOpen(true);}}><FontAwesomeIcon icon={faPlus}/> Registrar evento</button></header>
    <div className="vehicle-history-period"><label><span>De</span><input type="date" value={startDate} max={endDate} onChange={e=>setStartDate(e.target.value)}/></label><label><span>Até</span><input type="date" value={endDate} min={startDate} onChange={e=>setEndDate(e.target.value)}/></label><span className="vehicle-history-period__count">{history.length} {history.length===1?"evento":"eventos"} no período</span></div>
    {query.isFetching&&<p className="vehicle-history-loading">Atualizando histórico…</p>}
    {history.length===0?<div className="vehicle-details-empty"><FontAwesomeIcon icon={faCalendarDays}/><strong>Nenhum evento neste período</strong><p>Altere as datas ou registre um novo evento para este veículo.</p></div>:<ol className="vehicle-history-list">{history.map(event=><li key={event.id} className="vehicle-history-item"><span className={`vehicle-history-item__marker vehicle-history-item__marker--${eventTones[event.eventType]}`}/><article><header><div><span className={`vehicles-tag vehicles-tag--${eventTones[event.eventType]}`}>{eventLabels[event.eventType]}</span><time dateTime={event.eventDate}>{formatDate(event.eventDate)}</time></div><div className="vehicle-history-item__actions">{event.eventType!=="odometer_reset"&&<><button type="button" aria-label="Editar evento" title="Editar evento" onClick={()=>{setEditingEvent(event);setHistoryOpen(true);}}><FontAwesomeIcon icon={faPenToSquare}/></button><button type="button" aria-label="Excluir evento" title="Excluir evento" onClick={()=>{setActionError(null);setDeletingEvent(event);}}><FontAwesomeIcon icon={faTrash}/></button></>}</div></header><p>{event.description}</p><footer><span>{km(event.kilometerSnapshot)}</span><small>Criado em {formatDateTime(event.createdAt)}</small></footer></article></li>)}</ol>}
   </section>
  </section>
  <VehicleFormModal isOpen={editOpen} vehicle={vehicle} isSaving={vehicleMutations.update.isPending} onClose={()=>setEditOpen(false)} onSave={saveVehicle}/>
  <VehicleOdometerModal isOpen={odometerOpen} currentKilometer={vehicle.currentKilometer} isSaving={vehicleMutations.updateOdometer.isPending} onClose={()=>setOdometerOpen(false)} onSave={saveOdometer}/>
  <VehicleHistoryFormModal isOpen={historyOpen} event={editingEvent} currentKilometer={vehicle.currentKilometer} isSaving={historyMutations.create.isPending||historyMutations.update.isPending} onClose={()=>{setHistoryOpen(false);setEditingEvent(null);}} onSave={saveHistory}/>
  <Modal isOpen={Boolean(deletingEvent)} title="Excluir evento do histórico" onClose={()=>setDeletingEvent(null)}><div className="vehicle-confirm">{actionError&&<p className="vehicle-details-action-error" role="alert">{actionError}</p>}<p>Tem certeza de que deseja excluir este evento? Essa ação não poderá ser desfeita.</p><footer><button type="button" onClick={()=>setDeletingEvent(null)}>Cancelar</button><button className="vehicle-confirm__danger" type="button" disabled={historyMutations.remove.isPending} onClick={()=>void confirmDeleteEvent()}>{historyMutations.remove.isPending?"Excluindo…":"Excluir evento"}</button></footer></div></Modal>
  <Modal isOpen={deleteVehicleOpen} title="Excluir veículo" onClose={()=>setDeleteVehicleOpen(false)}><div className="vehicle-confirm">{actionError&&<p className="vehicle-details-action-error" role="alert">{actionError}</p>}<p>Excluir <strong>{vehicle.title}</strong>? Todo o histórico associado também será excluído permanentemente.</p><footer><button type="button" onClick={()=>setDeleteVehicleOpen(false)}>Cancelar</button><button className="vehicle-confirm__danger" type="button" disabled={vehicleMutations.remove.isPending} onClick={()=>void confirmDeleteVehicle()}>{vehicleMutations.remove.isPending?"Excluindo…":"Excluir veículo"}</button></footer></div></Modal>
 </main>;
}
