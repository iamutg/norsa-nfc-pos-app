import React from 'react';

function useModalState(): [
  visible: boolean,
  openModal: () => void,
  closeModal: () => void,
] {
  const [visible, setVisible] = React.useState(false);

  const openModal = () => {
    setVisible(true);
  };
  const closeModal = () => {
    setVisible(false);
  };

  return [visible, openModal, closeModal];
}

export default useModalState;
