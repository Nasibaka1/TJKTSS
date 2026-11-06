// Dynamic card outline class attachment
function getCardClassName(orderStatus) {
  return `task-card ${orderStatus === 'FULL_PAYMENT' ? 'status-full-payment' : ''}`;
}

// Collapsible toggle handler for payment proofs
function toggleProofs(button) {
  const content = button.nextElementSibling;
  const arrow = button.querySelector('.arrow-icon');
  
  const isHidden = content.classList.toggle('hidden');
  arrow.textContent = isHidden ? '[►]' : '[▼]';
}

// Admin / Employee payment proof upload handler
async function handleAdminPaymentUpload(event, txId) {
  const file = event.target.files[0];
  if (!file) return;
  console.log(`Uploading payment proof for ${txId}:`, file.name);
  // Add backend / Firebase storage upload logic here
}

// Admin / Employee status update handler
async function markAsFullPayment(txId) {
  try {
    console.log(`Updating status for transaction ${txId} to FULL_PAYMENT...`);
    // Add Firestore / API call logic here to persist status update
  } catch (err) {
    console.error("Failed to update status:", err);
  }
}
