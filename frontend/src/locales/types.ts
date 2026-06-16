export type Lang = 'ja' | 'en';

export interface Translations {
  nav: {
    consume: string;
    restock: string;
    manage: string;
    langToggle: string;
  };
  home: {
    question: string;
    lowStockAlert: (count: number) => string;
    lowStockDesc: string;
    stockLeft: string;
    thresholdLabel: string;
    orderedBadge: string;
    orderButton: string;
    detailButton: string;
    arrivedAlert: (count: number) => string;
    arrivedDesc: string;
    stockLabel: string;
    confirmButton: string;
  };
  consume: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    noImage: string;
    stockLeft: string;
    quickButton: string;
    quantityPlaceholder: string;
    useButton: string;
    detailButton: string;
    updateFailed: string;
  };
  restock: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    noImage: string;
    stockLeft: string;
    orderedSection: string;
    othersSection: string;
    noOrdered: string;
    noOthers: string;
    quickButton: string;
    quantityPlaceholder: string;
    restockButton: string;
    detailButton: string;
    notFound: (query: string) => string;
    updateFailed: string;
  };
  manage: {
    title: string;
    searchPlaceholder: string;
    addButton: string;
    colId: string;
    colName: string;
    colStock: string;
    colThreshold: string;
    colAction: string;
    editButton: string;
    deleteButton: string;
    deleteConfirm: (name: string) => string;
    deleteSuccess: string;
    deleteFailed: string;
  };
  addItem: {
    title: string;
    backButton: string;
    nameLabel: string;
    englishNameLabel: string;
    quantityLabel: string;
    thresholdLabel: string;
    keywordsLabel: string;
    urlLabel: string;
    imageLabel: string;
    submitButton: string;
    successMessage: string;
    failMessage: string;
  };
  itemDetail: {
    title: string;
    backButton: string;
    currentStock: string;
    statusLabel: string;
    setToStatus: (label: string) => string;
    nameLabel: string;
    englishNameLabel: string;
    thresholdLabel: string;
    keywordsLabel: string;
    urlLabel: string;
    imageLabel: string;
    saveButton: string;
    saveSuccess: string;
    saveFailed: string;
    statusUpdateFailed: string;
    historyTitle: string;
    noHistory: string;
    loading: string;
    actions: Record<string, string>;
    statuses: {
      NONE: string;
      ORDERED: string;
      ARRIVED: string;
    };
  };
}
