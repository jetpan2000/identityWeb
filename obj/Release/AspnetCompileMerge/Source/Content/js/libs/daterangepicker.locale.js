var DRPRanges = function (lang) {
	if (lang == "en")
	{
		return {
			'Today': [moment(), moment()],
			'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			'Last 7 Days': [moment().subtract(6, 'days'), moment()],
			'Last 30 Days': [moment().subtract(29, 'days'), moment()],
			'This Month': [moment().startOf('month'), moment().endOf('month')],
			'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
            'Last 12 Months': [moment().subtract(11, 'month').startOf('month'), moment().endOf('month')]
		};
	}
	else if (lang == "pt")
	{
		return {
			'Hoje': [moment(), moment()],
			'Ontem': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			'Últimos 7 Dias': [moment().subtract(6, 'days'), moment()],
			'Últimos 30 Dias': [moment().subtract(29, 'days'), moment()],
			'Este Mês': [moment().startOf('month'), moment().endOf('month')],
			'Último Mês': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
            'Últimos 12 Meses': [moment().subtract(11, 'month').startOf('month'), moment().endOf('month')]
		};
	}
	else if (lang == "es")
	{
		return {
			'Hoy': [moment(), moment()],
			'Ayer': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			'Últimos 7 Días': [moment().subtract(6, 'days'), moment()],
			'Últimos 30 Días': [moment().subtract(29, 'days'), moment()],
			'Este Mes': [moment().startOf('month'), moment().endOf('month')],
			'Mes pasado': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
            'Últimos 12 Meses': [moment().subtract(11, 'month').startOf('month'), moment().endOf('month')]
		};
	}
	else if (lang == "fr")
	{
		return {
			'Aujourd\'hui': [moment(), moment()],
			'Hier': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			'Derniers 7 jours': [moment().subtract(6, 'days'), moment()],
			'Derniers 30 jours': [moment().subtract(29, 'days'), moment()],
			'Ce Mois': [moment().startOf('month'), moment().endOf('month')],
			'Le mois dernier': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
			'Des 12 derniers mois': [moment().subtract(11, 'month').startOf('month'), moment().endOf('month')]
		};
	}
}

var DRPLocale = function (lang) {
	if (lang == "en") {
		return {
			"format": "MM/DD/YYYY",
			"separator": " - ",
			"applyLabel": "Apply",
			"cancelLabel": "Cancel",
			"fromLabel": "From",
			"toLabel": "To",
			"customRangeLabel": "Custom",
			"daysOfWeek": [
				"Su",
				"Mo",
				"Tu",
				"We",
				"Th",
				"Fr",
				"Sa"
			],
			"monthNames": [
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December"
			],
			"firstDay": 1
		};
	}
	else if (lang == "pt") {
		return {
			"format": "DD/MM/YYYY",
			"separator": " - ",
			"applyLabel": "Aplicar",
			"cancelLabel": "Cancelar",
			"fromLabel": "De",
			"toLabel": "Até",
			"customRangeLabel": "Personalizado",
			"daysOfWeek": [
				"Do",
				"Se",
				"Te",
				"Qu",
				"Qu",
				"Se",
				"Sá"
			],
			"monthNames": [
				"Janeiro",
				"Fevereiro",
				"Março",
				"Abril",
				"Maio",
				"Junho",
				"Julho",
				"Agosto",
				"Setembro",
				"Outubro",
				"Novembro",
				"Dezembro"
			],
			"firstDay": 1
		};
	}
	else if (lang == "es") {
		return {
			"format": "DD/MM/YYYY",
			"separator": " - ",
			"applyLabel": "Aplicar",
			"cancelLabel": "Cancelar",
			"fromLabel": "De",
			"toLabel": "A",
			"customRangeLabel": "Costumbre",
			"daysOfWeek": [
				"Do",
				"Lu",
				"Ma",
				"Mi",
				"Ju",
				"Vi",
				"Sá"
			],
			"monthNames": [
				"Enero",
				"Febrero",
				"Marzo",
				"Abril",
				"Mayo",
				"Junio",
				"Julio",
				"Agosto",
				"Septiembre",
				"Octubre",
				"Noviembre",
				"Diciembre"
			],
			"firstDay": 1
		};
	}
	else if (lang == "fr") {
		return {
			"format": "DD/MM/YYYY",
			"separator": " - ",
			"applyLabel": "Appliquer",
			"cancelLabel": "Annuler",
			"fromLabel": "De",
			"toLabel": "À",
			"customRangeLabel": "Coutume",
			"daysOfWeek": [
				"Di",
				"Lu",
				"Ma",
				"Me",
				"Je",
				"Ve",
				"Sa"
			],
			"monthNames": [
				"Janvier",
				"Février",
				"Mars",
				"Avril",
				"Mai",
				"Juin",
				"Juillet",
				"Août",
				"Septembre",
				"Octobre",
				"Novembre",
				"Décembre"
			],
			"firstDay": 1
		};
	}
};