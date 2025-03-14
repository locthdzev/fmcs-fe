import React, { useState, useEffect } from "react";
import { Modal, Button, Collapse } from "antd";
import { Listbox, ListboxItem } from "@heroui/react";
import { getMergeableBatchGroups, mergeBatchNumbers } from "@/api/batchnumber";
import { toast } from "react-toastify";

const { Panel } = Collapse;

interface MergeBatchNumbersModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MergeableBatchGroup {
  drugId: string;
  drugName: string;
  supplierId: string;
  supplierName: string;
  expiryDate: string;
  batches: {
    id: string;
    batchCode: string;
    manufacturingDate?: string;
    quantityReceived: number;
    status: string;
  }[];
}

const MergeBatchNumbersModal: React.FC<MergeBatchNumbersModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [mergeableGroups, setMergeableGroups] = useState<MergeableBatchGroup[]>(
    []
  );

  const fetchMergeableGroups = async () => {
    try {
      const groups = await getMergeableBatchGroups();
      setMergeableGroups(groups);
    } catch {
      toast.error("Unable to load mergeable batch groups.");
    }
  };

  useEffect(() => {
    if (visible) fetchMergeableGroups();
  }, [visible]);

  const handleMergeGroup = async (batchIds: string[]) => {
    try {
      const response = await mergeBatchNumbers({ batchNumberIds: batchIds });
      if (response.isSuccess) {
        toast.success("Batch numbers merged successfully!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Unable to merge batch numbers");
      }
    } catch {
      toast.error("Unable to merge batch numbers");
    }
  };

  return (
    <Modal
      title="Merge Batch Numbers"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div className="max-h-[60vh] overflow-y-auto">
        {mergeableGroups.length === 0 ? (
          <p className="text-gray-500">No mergeable batch groups available.</p>
        ) : (
          <Collapse accordion>
            {mergeableGroups.map((group, index) => (
              <Panel
                header={
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-base">
                      {`${group.drugName} - ${group.supplierName} - ${new Date(
                        group.expiryDate
                      ).toLocaleDateString()}`}
                    </span>
                    <Button
                      type="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMergeGroup(group.batches.map((b) => b.id));
                      }}
                    >
                      Merge Group
                    </Button>
                  </div>
                }
                key={index}
              >
                <Listbox>
                  {group.batches.map((batch) => (
                    <ListboxItem
                      key={batch.id}
                      title={batch.batchCode}
                      description={`Manufactured: ${
                        batch.manufacturingDate
                          ? new Date(
                              batch.manufacturingDate
                            ).toLocaleDateString()
                          : "-"
                      } | Quantity: ${batch.quantityReceived} | Status: ${
                        batch.status
                      }`}
                      className="py-2"
                    />
                  ))}
                </Listbox>
              </Panel>
            ))}
          </Collapse>
        )}
      </div>
    </Modal>
  );
};

export default MergeBatchNumbersModal;
