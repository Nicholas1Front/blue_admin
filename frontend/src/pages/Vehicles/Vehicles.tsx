import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faGaugeHigh, faPlus, faRotate, faWrench, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { AppHeader } from "../../components/AppHeader/AppHeader";
import { BackLink } from "../../components/BackLink/BackLink";
import { useVehicleDashboard, useVehicleMutations, useVehiclesByFilters } from "../../modules/vehicles/vehicles.hooks";
import type { CreateVehicleRequest, FindVehiclesByFilters, VehicleEventType, VehicleSummary } from "../../modules/vehicles/vehicles.types";
import { VehicleAdvancedFiltersForm } from "./components/VehicleAdvancedFiltersForm";
import { VehicleFormModal } from "./components/VehicleFormModal";
import "./Vehicles.css";

const PAGE_SIZE = 10;
const labels: Record<VehicleEventType,string> = { maintenance:"Manutenção", issue:"Problema identificado", observation:"Observação", problem_solved:"Problema resolvido", odometer_reset:"Reinicialização do hodômetro" };
const tones: Record<VehicleEventType,string> = { maintenance:"info", issue:"warning", observation:"neutral", problem_solved:"success", odometer_reset:"warning" };
type Draft = Omit<FindVehiclesByFilters,"page"|"limit">;
const date = (v?:string|null) => v && !Number.isNaN(new Date(v).getTime()) ? new Date(v).toLocaleDateString("pt-BR") : "Não informado";
const km = (v?:number|null) => v == null ? "Não informado" : new Intl.NumberFormat("pt-BR").format(v)+" km";

function VehicleRow({ vehicle }: { vehicle: VehicleSummary }) {
 return <Link className="vehicles-row" to={`/vehicles/${encodeURIComponent(vehicle.id)}`}>
  <span className="vehicles-row__icon"><FontAwesomeIcon icon={faCar}/></span>
  <span className="vehicles-row__body">
   <span className="vehicles-row__title"><strong>{vehicle.title}</strong><small>{vehicle.plate || "Sem placa"}</small></span>
   <span className="vehicles-row__meta"><span><FontAwesomeIcon icon={faGaugeHigh}/> {km(vehicle.currentKilometer)}</span><span><FontAwesomeIcon icon={faWrench}/> {vehicle.historyCount} {vehicle.historyCount===1?"evento":"eventos"}</span></span>
   {vehicle.lastEvent ? <span className="vehicles-row__event"><b className={`vehicles-tag vehicles-tag--${tones[vehicle.lastEvent.eventType]}`}>{labels[vehicle.lastEvent.eventType]}</b><span>{vehicle.lastEvent.description}</span><time>Registrado em {date(vehicle.lastEvent.createdAt)}</time></span> : <span className="vehicles-row__event vehicles-row__event--empty">Nenhum evento registrado</span>}
  </span><FontAwesomeIcon className="vehicles-row__arrow" icon={faArrowRight}/>
 </Link>;
}

export function Vehicles() {
 const [page,setPage]=useState(1);
 const [draft,setDraft]=useState<Draft>({});
 const [filters,setFilters]=useState<FindVehiclesByFilters|null>(null);
 const [createOpen,setCreateOpen]=useState(false);
 const dashboard=useVehicleDashboard({page,limit:PAGE_SIZE});
 const filtered=useVehiclesByFilters(filters??{page:1,limit:PAGE_SIZE},filters!==null);
 const mutations=useVehicleMutations();
 const searching=filters!==null;
 const query=searching?filtered:dashboard;
 const rows=searching?filtered.data?.vehicles??[]:dashboard.data?.vehicles??[];
 const pagination=searching?filtered.data:dashboard.data?.pagination;
 const total=pagination?.total??0, pages=pagination?.totalPages??0, current=searching?filters?.page??1:page;
 function change(key:keyof Draft,value:string|number|undefined){setDraft(s=>({...s,[key]:value===""?undefined:value}));}
 function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const values=Object.fromEntries(Object.entries(draft).filter(([,v])=>v!==undefined&&v!==null&&v!=="")) as Draft;setFilters(Object.keys(values).length?{...values,page:1,limit:PAGE_SIZE}:null);setPage(1);}
 function clear(){setDraft({});setFilters(null);setPage(1);}
 function changePage(next:number){if(next<1||next>pages)return;if(searching)setFilters(s=>s?{...s,page:next}:s);else setPage(next);}
 async function save(data:CreateVehicleRequest){await mutations.create.mutateAsync(data);setCreateOpen(false);clear();}
 return <main className="vehicles-page">
  <title>Veículos | Blue Admin</title><AppHeader/><nav className="page-back-row"><BackLink/></nav>
  <section className="vehicles-content">
   <header className="vehicles-heading"><div><span className="vehicles-eyebrow">Gestão da oficina</span><h1>Veículos.</h1><p>Consulte os veículos cadastrados e acompanhe suas manutenções e ocorrências.</p></div><button className="vehicles-primary" onClick={()=>setCreateOpen(true)} type="button"><FontAwesomeIcon icon={faPlus}/> Cadastrar veículo</button></header>
   <section className="vehicles-panel"><header className="vehicles-panel__heading"><div><span className="vehicles-eyebrow">Localização rápida</span><h2>Pesquisar veículos</h2><p>Combine filtros do cadastro com informações registradas no histórico.</p></div></header><VehicleAdvancedFiltersForm values={draft} onChange={change} onSubmit={submit} onClear={clear}/></section>
   <section className="vehicles-panel vehicles-results"><header className="vehicles-panel__heading"><div><span className="vehicles-eyebrow">{searching?"Resultado da pesquisa":"Frota cadastrada"}</span><h2>{searching?"Veículos encontrados":"Veículos recentes"}</h2><p>{searching?`${total} resultado(s) para os filtros aplicados.`:"Acesse um veículo para consultar seus dados e histórico completo."}</p></div>{searching&&<button className="vehicles-clear" onClick={clear} type="button">Limpar pesquisa</button>}</header>
    {query.isPending?<div className="vehicles-state"><span className="vehicles-spinner"/>Carregando veículos…</div>:query.isError?<div className="vehicles-state" role="alert"><strong>Não foi possível carregar os veículos.</strong><p>Verifique sua conexão e tente novamente.</p><button type="button" onClick={()=>void query.refetch()}><FontAwesomeIcon icon={faRotate}/> Tentar novamente</button></div>:rows.length===0?<div className="vehicles-state"><span className="vehicles-empty-icon"><FontAwesomeIcon icon={faCar}/></span><strong>{searching?"Nenhum veículo encontrado":"Nenhum veículo cadastrado"}</strong><p>{searching?"Revise os filtros ou limpe a pesquisa.":"Cadastre o primeiro veículo para começar a acompanhar seu histórico."}</p>{!searching&&<button type="button" onClick={()=>setCreateOpen(true)}><FontAwesomeIcon icon={faPlus}/> Cadastrar veículo</button>}</div>:<div className="vehicles-list">{rows.map(v=><VehicleRow key={v.id} vehicle={{...v,historyCount:"historyCount" in v?v.historyCount:v._count.history,lastEvent:"lastEvent" in v?v.lastEvent:null}}/>)}</div>}
    {total>0&&<nav className="vehicles-pagination" aria-label="Paginação"><span>Página <strong>{current}</strong> de <strong>{Math.max(pages,1)}</strong> · {total} {total===1?"veículo":"veículos"}</span><div><button type="button" disabled={current<=1} onClick={()=>changePage(current-1)}>Anterior</button><button type="button" disabled={current>=pages} onClick={()=>changePage(current+1)}>Próxima</button></div></nav>}
   </section>
  </section>
  <VehicleFormModal isOpen={createOpen} isSaving={mutations.create.isPending} onClose={()=>setCreateOpen(false)} onSave={save}/>
 </main>;
}
