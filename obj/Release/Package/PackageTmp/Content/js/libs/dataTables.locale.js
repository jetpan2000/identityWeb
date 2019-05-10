var DTLocale = function (lang) {
    if (lang == "en") {
        return {
            "lengthMenu": "Display _MENU_ records per page",
            "loadingRecords": "Loading...",
            "processing": "Loading...",
            "zeroRecords": "No records found",
            "info": "Showing _START_ to _END_ of _TOTAL_ records", // Showing page _PAGE_ of _PAGES_
            "infoEmpty": "No records available",
            "infoFiltered": "(filtered from _MAX_ total records)",
            "paginate": {
                "first": "First",
                "last": "Last",
                "previous": "Previous",
                "next": "Next"
            }
        };
    }
    else if (lang == "pt") {
        return {
            "lengthMenu": "Mostrar _MENU_ registros por página",
            "loadingRecords": "Carregando...",
            "processing": "Carregando...",
            "zeroRecords": "Nenhum registro encontrado",
            "info": "Mostrando _START_ até _END_ de um total de _TOTAL_ registros", // Mostrando página _PAGE_ de _PAGES_
            "infoEmpty": "Nenhum registro disponível",
            "infoFiltered": "(filtrado de um total de _MAX_ registros)",
            "paginate": {
                "first": "Primeira Página",
                "last": "Última Página",
                "previous": "Anterior",
                "next": "Próxima"
            }
        };
    }
    else if (lang == "es") {
        return {
            "lengthMenu": "Visualizar _MENU_ registros por página",
            "zeroRecords": "Nada encontrado",
            "info": "Mostrando _START_ a _END_ de _TOTAL_ entradas", // Mostrando la página _PAGE_ de _PAGES_
            "infoEmpty": "No hay registros disponibles",
            "infoFiltered": "(filtrado de um total de _MAX_ registros)",
            "paginate": {
                "first": "Primera Página",
                "last": "Última Página",
                "previous": "Anterior",
                "next": "Siguiente"
            }
        };
    }
    else if (lang == "fr") {
        return {
            "lengthMenu": "Affichage _MENU_ enregistrements par page",
            "loadingRecords": "Chargement en cours...",
            "processing": "Chargement en cours...",
            "zeroRecords": "Rien n'a été trouvé",
            "info": "Affichage de _START_ à _END_ de _TOTAL_ entrées", // Afficher la page _PAGE_ de _PAGES_
            "infoEmpty": "Aucun enregistrement disponible",
            "infoFiltered": "(filtré totaux _MAX_ records)",
            "paginate": {
                "first": "Première Page",
                "last": "Dernière Page",
                "previous": "Précédent",
                "next": "Prochain"
            }
        };
    }
};

var DTExport = function (lang) {
    if (lang == "en") {
        return "Export";
    }
    else if (lang == "pt") {
        return "Exportar";
    }
    else if (lang == "es") {
        return "Exportar";
    }
    else if (lang == "fr") {
        return "Exportation";
    }
};

var DTCurrentPage = function (lang) {
    if (lang == "en") {
        return "Current Page";
    }
    else if (lang == "pt") {
        return "Página Atual";
    }
    else if (lang == "es") {
        return "Página Actual";
    }
    else if (lang == "fr") {
        return "Page Actuelle";
    }
};

var DTAllPages = function (lang) {
    if (lang == "en") {
        return "All Pages";
    }
    else if (lang == "pt") {
        return "Todas as Páginas";
    }
    else if (lang == "es") {
        return "Todas las Páginas";
    }
    else if (lang == "fr") {
        return "Toutes les Pages";
    }
};

var DTViewAsOneImage = function (lang) {
    if (lang == "en") {
        return "View selected documents";
    }
    else if (lang == "pt") {
        return "Ver documentos selecionados";
    }
    else if (lang == "es") {
        return "Ver documentos seleccionados";
    }
    else if (lang == "fr") {
        return "Voir les documents sélectionnés";
    }
};