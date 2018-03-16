const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.listen(5000);

app.get('/', function(req, res){

res.sendFile('index.html',{"root": __dirname});
})


app.get('/frete',function(req, response){


    var url = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins='+req.query.cepRemetente+'&destinations='+req.query.cepDestinatario+'&mode=driving&language=pt-BR&sensor=false';

    var distancia = '';
    var duracao = '';
    https.get(url, function(res) {
        res.setEncoding("utf8");
        var body = "";
        res.on("data", function(data) {
            body += data;
        });
        res.on("end", function() {
            body = JSON.parse(body);
            distancia = body.rows[0].elements[0].distance.value;
            duracao = body.rows[0].elements[0].duration.value;
            endeDest = body.destination_addresses;
            endeOrig = body.origin_addresses;
           
            valorFrete = getValorFrete(distancia,endeOrig,endeDest);
            dataEntrega = getDataEntrega(duracao);

            response.send({ 'valorFrete': formataDinheiro(valorFrete),'prazoFrete': formataDataHora(dataEntrega) });
        });
      });
    })


function mesmaRegiao(ende1,ende2){

    var arr1 = ende1.toString().split(",");
    estado1 = arr1[1].slice(-2);

    var arr2 = ende2.toString().split(",");
    estado2 = arr2[1].slice(-2);

    if (getRegiao(estado1) == getRegiao(estado2)){
        return true;
    }
    
}

function getRegiao(str){
    const norte = ['AC','AP','AM','PA','RO','RR','TO'];
    const nordeste = ['AL','BA','CE','MA','PB','PE','PI','RN','SE'];
    const centrooeste = ['GO','MS','MT','DF'];
    const sudeste = ['SP','RJ','ES','MG'];
    const sul = ['SC','RS','PR']

    if (norte.includes(str)){
        return 'norte';
    }
    if (nordeste.includes(str)){
        return 'nordeste';
    }
    if (centrooeste.includes(str)){
        return 'centrooeste';
    }
    if (sudeste.includes(str)){
        return 'sudeste';
    }
    if (sul.includes(str)){
        return 'sul';
    }
}

function getValorFrete(distancia,endeOrig,endeDest){
    if (mesmaRegiao(endeDest,endeOrig)){
        return 1.2*distancia/1000;
    } else{
        return 1.56*distancia/1000;
    }


}


function getDataEntrega(duracao){

    var dataHoraEntrega = new Date();
    
    var divresultado = Math.floor(duracao/28800);
    var divresto = duracao % 28800;

    var prazoEmDias = divresultado + (divresto>0? 1:0);

    var domingos =  Math.floor((dataHoraEntrega.getDay()+prazoEmDias)/ 7);

    dataHoraEntrega.setDate(dataHoraEntrega.getDate() + prazoEmDias + domingos);
    if (dataHoraEntrega.getDay() == 0){
        dataHoraEntrega.setDate(dataHoraEntrega.getDate() + 1);
    } 

    var horas = Math.floor(divresto/3600);

    if (divresto > 14400){
        horas +=2;
    }
    var minutos = (divresto%3600)/60
    dataHoraEntrega.setHours(horas+8, minutos,0);
    return dataHoraEntrega

}

function formataDinheiro(n) {
    return "R$ " + n.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+\,)/g, "$1.");
    }

function formataDataHora(data){
    var dia     = data.getDate();
    var mes     = data.getMonth()+1;
    var ano     = data.getFullYear();
    var hora    = data.getHours();
    var min     = data.getMinutes();
    if (dia.toString().length == 1)
      dia = "0"+dia;
    if (mes.toString().length == 1)
      mes = "0"+mes;
    return dia+"/"+mes+"/"+ano+" "+hora+":"+min;
}
