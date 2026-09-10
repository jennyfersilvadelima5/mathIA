/* MEU ALIMENTO — TEACHABLE MACHINE
   1. Publique seu modelo no Teachable Machine.
   2. Copie o endereço que termina com /models/XXXXX/
   3. Cole abaixo.
*/
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/SEU_MODELO_AQUI/";

/* A chave de cada item precisa ser EXATAMENTE igual ao nome da classe do Teachable Machine.
   Os dados abaixo são exemplos de estrutura. Substitua pelos dados reais conferidos nos rótulos.
*/
const PRODUTOS = {
  "Produto A": {
    nome: "Produto A",
    imagem: "assets/img/produtos/nao-cadastrado.svg",
    descricao: "Exemplo de produto cadastrado. Troque este texto pela descrição do produto real.",
    gluten: "CONTÉM GLÚTEN",
    lactose: "CONTÉM LACTOSE",
    calorias: "Ex.: 120 kcal / porção",
    acucares: "Ex.: 10 g / porção",
    sodio: "Ex.: 160 mg / porção",
    gordura: "Ex.: 2,5 g / porção",
    alergenos: "Exemplo: contém derivados de trigo e leite. Substitua pelo texto do rótulo.",
    contraindicacao: "Exemplo: exige atenção de pessoas com doença celíaca e de quem precisa evitar lactose, conforme as informações cadastradas do rótulo.",
    alternativa: "Produto B",
    comparacao: "Exemplo: alternativa da mesma categoria com característica nutricional diferente. Explique usando valores reais dos rótulos.",
    fonte: "Rótulo do produto — dados cadastrados manualmente.",
    nota: "Confira sempre a embalagem física, pois o fabricante pode alterar ingredientes, alertas e tabela nutricional."
  },
  "Produto B": {
    nome: "Produto B",
    imagem: "assets/img/produtos/nao-cadastrado.svg",
    descricao: "Segundo exemplo para você substituir por um produto real treinado no seu modelo.",
    gluten: "NÃO CONTÉM GLÚTEN",
    lactose: "NÃO CONTÉM LACTOSE",
    calorias: "Ex.: 95 kcal / porção",
    acucares: "Ex.: 5 g / porção",
    sodio: "Ex.: 110 mg / porção",
    gordura: "Ex.: 1,2 g / porção",
    alergenos: "Copie exatamente os alérgenos declarados no rótulo.",
    contraindicacao: "Use somente alertas ou restrições que possam ser sustentados pelas informações do rótulo; não faça diagnóstico.",
    alternativa: "Produto A",
    comparacao: "Compare porções equivalentes sempre que possível.",
    fonte: "Rótulo do produto — dados cadastrados manualmente.",
    nota: "Esta plataforma é educativa e não substitui orientação médica ou nutricional."
  }
};

const MIN_CONFIDENCE=.85, STABLE_FRAMES=7;
let model=null,stream=null,animationId=null,lastCandidate="",stableCount=0,running=false;
const $=id=>document.getElementById(id);
const els={video:$("camera"),placeholder:$("cameraPlaceholder"),startBtn:$("startBtn"),stopBtn:$("stopBtn"),cameraStatus:$("cameraStatus"),modelStatus:$("modelStatus"),confidenceText:$("confidenceText"),confidenceBar:$("confidenceBar"),detectedLabel:$("detectedLabel"),resultCard:$("resultCard"),resultStatus:$("resultStatus"),productName:$("productName"),productDescription:$("productDescription"),productImage:$("productImage"),gluten:$("gluten"),lactose:$("lactose"),calorias:$("calorias"),acucares:$("acucares"),sodio:$("sodio"),gordura:$("gordura"),alergenos:$("alergenos"),contraindicacao:$("contraindicacao"),alternativa:$("alternativa"),comparacao:$("comparacao"),fonte:$("fonte"),scientificNote:$("scientificNote"),liveDot:document.querySelector('.live-dot'),scanSweep:document.querySelector('.scan-sweep')};
function configured(){return MODEL_URL.startsWith('https://')&&!MODEL_URL.includes('SEU_MODELO_AQUI')}
async function loadModel(){if(!configured())throw new Error('Cole o link do seu modelo no início de assets/js/ia.js.');els.modelStatus.textContent='Carregando modelo...';model=await tmImage.load(MODEL_URL+'model.json',MODEL_URL+'metadata.json');els.modelStatus.textContent='Modelo carregado'}
async function startCamera(){try{els.startBtn.disabled=true;els.startBtn.textContent='Preparando...';if(!model)await loadModel();stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});els.video.srcObject=stream;await els.video.play();running=true;els.video.style.display='block';els.placeholder.style.display='none';els.startBtn.classList.add('hidden');els.stopBtn.classList.remove('hidden');els.cameraStatus.textContent='Câmera ativa';els.liveDot.classList.add('on');els.scanSweep.classList.add('on');predictLoop()}catch(e){console.error(e);els.startBtn.disabled=false;els.startBtn.textContent='Tentar novamente';els.cameraStatus.textContent='Verifique a configuração';els.modelStatus.textContent='Não iniciado';showMessage(e.message)}}
async function predictLoop(){if(!running||!model)return;const predictions=await model.predict(els.video,false);const best=predictions.reduce((a,b)=>a.probability>b.probability?a:b);const c=Math.round(best.probability*100);els.confidenceText.textContent=c+'%';els.confidenceBar.style.width=c+'%';els.detectedLabel.textContent='Mais provável: '+best.className;if(best.probability>=MIN_CONFIDENCE){if(lastCandidate===best.className)stableCount++;else{lastCandidate=best.className;stableCount=1}if(stableCount>=STABLE_FRAMES)showProduct(best.className)}else{lastCandidate='';stableCount=0}animationId=requestAnimationFrame(predictLoop)}
function setData(p){els.productName.textContent=p.nome;els.productDescription.textContent=p.descricao;els.productImage.src=p.imagem||'assets/img/produtos/nao-cadastrado.svg';els.productImage.alt='Imagem de '+p.nome;els.gluten.textContent=p.gluten||'Não cadastrado';els.lactose.textContent=p.lactose||'Não cadastrado';els.calorias.textContent=p.calorias||'Não cadastrado';els.acucares.textContent=p.acucares||'Não cadastrado';els.sodio.textContent=p.sodio||'Não cadastrado';els.gordura.textContent=p.gordura||'Não cadastrado';els.alergenos.textContent=p.alergenos||'Não cadastrado';els.contraindicacao.textContent=p.contraindicacao||'Consulte o rótulo.';els.alternativa.textContent=p.alternativa||'Nenhuma alternativa cadastrada';els.comparacao.textContent=p.comparacao||'';els.fonte.textContent=p.fonte||'Rótulo do produto';els.scientificNote.textContent=p.nota||'Confira sempre a embalagem física.'}
function showProduct(name){const p=PRODUTOS[name];if(!p)return showUnknown(name);els.resultCard.className='product-result recognized';els.resultStatus.className='status-pill recognized';els.resultStatus.textContent='Produto reconhecido';setData(p)}
function showUnknown(name){els.resultCard.className='product-result unknown';els.resultStatus.className='status-pill unknown';els.resultStatus.textContent='Produto não cadastrado';setData({nome:name||'Produto não cadastrado',descricao:'A IA reconheceu esta classe, mas não há informações associadas a ela no cadastro PRODUTOS.',imagem:'assets/img/produtos/nao-cadastrado.svg',contraindicacao:'Sem dados cadastrados. Consulte o rótulo físico.',nota:'Não interprete ausência de cadastro como ausência de glúten, lactose, alérgenos ou qualquer outro componente.'})}
function showMessage(msg){els.resultCard.className='product-result unknown';els.resultStatus.className='status-pill unknown';els.resultStatus.textContent='Configuração necessária';els.productName.textContent='A câmera/IA ainda não iniciou';els.productDescription.textContent=msg}
function stopCamera(){running=false;if(animationId)cancelAnimationFrame(animationId);if(stream)stream.getTracks().forEach(t=>t.stop());els.video.srcObject=null;els.video.style.display='none';els.placeholder.style.display='flex';els.startBtn.classList.remove('hidden');els.stopBtn.classList.add('hidden');els.startBtn.disabled=false;els.startBtn.textContent='Iniciar câmera e IA';els.cameraStatus.textContent='Câmera desligada';els.liveDot.classList.remove('on');els.scanSweep.classList.remove('on');els.confidenceText.textContent='0%';els.confidenceBar.style.width='0%';els.detectedLabel.textContent='Nenhum produto identificado.';lastCandidate='';stableCount=0}
els.startBtn.addEventListener('click',startCamera);els.stopBtn.addEventListener('click',stopCamera);if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){showMessage('Este navegador não oferece acesso à câmera. Publique o site em HTTPS e use um navegador moderno.');els.startBtn.disabled=true}
